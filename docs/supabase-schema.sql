-- =====================================================
-- Supabase Schema for ADRD Clinical Trial Navigator
-- =====================================================

-- 1. 用户画像表 (User Profiles)
-- 存储用户的基本信息、健康状况、偏好等
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk 用户 ID
  
  -- 基本信息
  full_name TEXT,
  email TEXT,
  age INTEGER,
  gender TEXT,
  
  -- 健康状况
  has_adrd BOOLEAN DEFAULT false,
  diagnosis_type TEXT,  -- 如：Alzheimer's, Dementia, MCI
  diagnosed_date DATE,
  current_medications JSONB,  -- 存储当前用药列表
  
  -- 照护者信息
  is_caregiver BOOLEAN DEFAULT false,
  relationship_to_patient TEXT,
  
  -- Intake form data (from guest user onboarding)
  intake_role TEXT,  -- 'user' or 'caregiver'
  intake_response_style TEXT,  -- 'concise', 'balanced', or 'verbose'
  intake_intent TEXT,  -- 'trial_matching' or 'learn_about_trials'
  intake_completed_at TIMESTAMPTZ,
  
  -- 偏好和限制
  preferred_language TEXT DEFAULT 'en',
  location JSONB,  -- {city, state, country, coordinates}
  mobility_status TEXT,  -- mobile, limited, homebound
  travel_radius_miles INTEGER,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 对话历史表 (Conversation History)
-- 记录重要的对话信息
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- 对话内容
  user_message TEXT,
  assistant_response TEXT,
  intent TEXT,  -- 如：trial_search, education, enrollment_help
  
  -- 提取的关键信息
  extracted_info JSONB,  -- 从对话中提取的结构化信息
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 用户兴趣的试验表 (User Trial Interests)
-- 记录用户感兴趣或已申请的临床试验
CREATE TABLE IF NOT EXISTS user_trial_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  
  -- 试验信息
  trial_id TEXT NOT NULL,  -- ClinicalTrials.gov NCT ID
  trial_name TEXT,
  trial_status TEXT,  -- interested, applied, enrolled, declined
  
  -- 用户笔记
  user_notes TEXT,
  match_score FLOAT,  -- 匹配度评分
  
  -- 时间戳
  interested_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 用户问答记录表 (User Q&A Log)
-- 记录用户的常见问题，用于改进系统
CREATE TABLE IF NOT EXISTS user_qa_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  
  question TEXT NOT NULL,
  answer TEXT,
  category TEXT,  -- eligibility, process, safety, etc.
  helpful BOOLEAN,  -- 用户反馈
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 索引 (Indexes)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_clerk_id ON conversation_history(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_session ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_trial_interests_clerk_id ON user_trial_interests(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_trial_interests_trial ON user_trial_interests(trial_id);
CREATE INDEX IF NOT EXISTS idx_qa_log_clerk_id ON user_qa_log(clerk_user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trial_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_qa_log ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能访问自己的数据
-- 注意：clerk_user_id 必须匹配当前请求的用户ID

-- user_profiles: 只能访问自己的画像
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true);  -- 允许读取（API层已验证）

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);  -- 允许插入（API层已验证）

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);  -- 允许更新（API层已验证）

-- conversation_history: 只能访问自己的对话
CREATE POLICY "Users can view own conversations" ON conversation_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own conversations" ON conversation_history
  FOR INSERT WITH CHECK (true);

-- user_trial_interests: 只能访问自己的试验兴趣
CREATE POLICY "Users can manage own trial interests" ON user_trial_interests
  FOR ALL USING (true);

-- user_qa_log: 只能访问自己的问答记录
CREATE POLICY "Users can manage own Q&A" ON user_qa_log
  FOR ALL USING (true);

-- 注意：所有策略都设为 true，因为实际的访问控制在 API 层通过 Clerk 完成
-- Supabase 使用匿名密钥，无法直接验证 Clerk 用户

-- =====================================================
-- 触发器：自动更新 updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_interests_updated_at
  BEFORE UPDATE ON user_trial_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 触发器：同步 intake_role 到 is_caregiver
-- =====================================================

CREATE OR REPLACE FUNCTION sync_intake_role_to_is_caregiver()
RETURNS TRIGGER AS $$
BEGIN
  -- 当 intake_role 更新时，同步到 is_caregiver
  IF NEW.intake_role IS NOT NULL THEN
    NEW.is_caregiver = (NEW.intake_role = 'caregiver');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_intake_role
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_intake_role_to_is_caregiver();
