# Clinical Trials Search Tool

## Environment Variables

Add to your `.env.local`:
```bash
CLINICAL_TRIALS_API_KEY=your_api_key_here
```

## Tool Definition for Agent Builder

```json
{
  "name": "get_trials",
  "description": "Search for clinical trials matching patient criteria including age, sex, location, medical conditions, and preferences. Returns a list of matching trials with detailed information and match reports.",
  "parameters": {
    "type": "object",
    "properties": {
      "age": {
        "type": "integer",
        "minimum": 0,
        "maximum": 200,
        "description": "Age of the patient, must be between 0 and 200."
      },
      "min_age": {
        "type": "integer",
        "minimum": 0,
        "maximum": 200,
        "description": "Minimum age of the patient, must be between 0 and 200."
      },
      "max_age": {
        "type": "integer",
        "minimum": 0,
        "maximum": 200,
        "description": "Maximum age of the patient, must be between 0 and 200."
      },
      "sex": {
        "type": "string",
        "enum": ["male", "female", "all"],
        "description": "Sex of the patient, represented as an enumeration."
      },
      "street": {
        "type": "string",
        "description": "Street address of the location"
      },
      "city": {
        "type": "string",
        "description": "City of the location"
      },
      "county": {
        "type": "string",
        "description": "County of the location"
      },
      "state": {
        "type": "string",
        "description": "State or province of the location"
      },
      "country": {
        "type": "string",
        "description": "Country of the location"
      },
      "zipcode": {
        "type": "string",
        "description": "Postal code of the location"
      },
      "lon": {
        "type": "number",
        "description": "Longitude of the location"
      },
      "lat": {
        "type": "number",
        "description": "Latitude of the location"
      },
      "conditions": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "List of medical conditions the patient has."
      },
      "pref_distance": {
        "type": "integer",
        "description": "Preferred maximum distance (in miles) for clinical trials."
      },
      "drive_duration": {
        "type": "number",
        "description": "Preferred maximum driving duration (in hours) to the clinical trial location."
      },
      "start_year": {
        "type": "integer",
        "description": "Preferred start year for the clinical trial."
      },
      "start_month": {
        "type": "integer",
        "description": "Preferred start month for the clinical trial."
      },
      "start_day": {
        "type": "integer",
        "description": "Preferred start day for the clinical trial."
      },
      "end_year": {
        "type": "integer",
        "description": "Preferred end year for the clinical trial."
      },
      "end_month": {
        "type": "integer",
        "description": "Preferred end month for the clinical trial."
      },
      "end_day": {
        "type": "integer",
        "description": "Preferred end day for the clinical trial."
      },
      "top_n": {
        "type": "integer",
        "description": "Number of top clinical trials to return based on the matching criteria."
      },
      "intervention_types": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "drug",
            "device",
            "biological/vaccine",
            "procedure/surgery",
            "radiation",
            "behavioral",
            "genetic",
            "dietary_supplement",
            "combination_product",
            "diagnostic_test",
            "other"
          ]
        },
        "description": "List of preferred intervention types for the clinical trials."
      },
      "phases": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "na",
            "early_phase1",
            "phase1",
            "phase2",
            "phase3",
            "phase4"
          ]
        },
        "description": "List of preferred clinical trial phases."
      }
    }
  }
}
```

## Usage Examples

### 1. Basic Search by Age and Location
```javascript
{
  "age": 68,
  "city": "San Francisco",
  "state": "CA",
  "conditions": ["Alzheimer Disease"],
  "top_n": 10
}
```

### 2. Search with Distance Preference
```javascript
{
  "age": 72,
  "zipcode": "94102",
  "conditions": ["dementia", "mild cognitive impairment"],
  "pref_distance": 25,
  "top_n": 5
}
```

### 3. Advanced Search with Filters
```javascript
{
  "min_age": 60,
  "max_age": 85,
  "sex": "all",
  "state": "CA",
  "conditions": ["Alzheimer Disease"],
  "phases": ["phase2", "phase3"],
  "intervention_types": ["drug", "behavioral"],
  "pref_distance": 50,
  "top_n": 15
}
```

## Response Structure

The API returns a simplified response optimized for ChatKit:

```json
{
  "success": true,
  "count": 5,
  "summary": "Found 5 matching trials",
  "trials": [
    {
      "id": "NCT12345678",
      "title": "Study of Drug X for Alzheimer's Disease",
      "recruitment_status": "recruiting",
      "summary": "A phase 3 study evaluating the efficacy of Drug X in patients with mild to moderate Alzheimer's disease...",
      "locations": [
        {
          "city": "San Francisco",
          "state": "CA",
          "country": "United States"
        },
        {
          "city": "Los Angeles",
          "state": "CA",
          "country": "United States"
        }
      ],
      "eligibility": {
        "sex": "all",
        "min_age": 50,
        "max_age": 85
      },
      "phases": ["phase3"],
      "intervention_types": ["drug"],
      "conditions": [
        "Alzheimer Disease",
        "Dementia"
      ],
      "match_reports": [
        {
          "filter_type": "age",
          "result": true,
          "result_text": "Patient age 68 is within trial range 50-85",
          "matched_location_count": 0
        },
        {
          "filter_type": "location",
          "result": true,
          "result_text": "Trial locations found within preferred distance",
          "matched_location_count": 2
        }
      ],
      "rank": 1
    }
  ]
}
```

## Key Fields in Response

### Top Level
- `success`: Boolean indicating if the search was successful
- `count`: Number of trials returned
- `summary`: Human-readable summary of results
- `trials[]`: Array of simplified trial objects

### Trial Object
- `id`: NCT number or unique identifier
- `title`: Trial official title
- `recruitment_status`: Current enrollment status (recruiting, completed, etc.)
- `summary`: Short summary of the trial (50-100 words)
- `locations[]`: Up to 3 trial site locations (city, state, country only)
- `eligibility.sex`: Gender eligibility (male, female, all)
- `eligibility.min_age`: Minimum age
- `eligibility.max_age`: Maximum age
- `phases[]`: Trial phases (e.g., ["phase2", "phase3"])
- `intervention_types[]`: Types of interventions
- `conditions[]`: Up to 5 conditions being studied
- `match_reports[]`: Array of match results for each filter criterion
- `rank`: Trial ranking (1 = best match)

### Match Report
- `filter_type`: Type of filter (age, sex, location, date, phase, intervention_type)
- `result`: Boolean indicating if criterion matched
- `result_text`: Human-readable explanation
- `matched_location_count`: Number of locations within preferred distance (for location filters)

**Note:** The response is simplified from the full API to prevent ChatKit timeout/CORS issues. Only essential fields are included.

## Integration Tips

### 1. Use User Profile Data
```javascript
// Get user profile first
const profile = await get_user_profile({});

// Search trials using profile data
const result = await get_trials({
  age: profile.age,
  city: profile.location.city,
  state: profile.location.state,
  conditions: profile.has_adrd ? ["Alzheimer Disease"] : [],
  pref_distance: profile.travel_radius_miles || 50,
  top_n: 10
});

// result.trials contains the array of matching trials
// result.count is the number of trials found
// result.summary is a human-readable summary
```

### 2. Save Interesting Trials
```javascript
// After user expresses interest in a trial
const trial = result.trials[0]; // First trial

await save_trial_interest({
  trial_id: trial.id,
  trial_name: trial.title,
  trial_status: "interested",
  match_score: trial.rank ? (1 / trial.rank) : 0.5, // Higher rank = better match
  user_notes: "Looks promising, close to home"
});
```

### 3. Filter by Multiple Conditions
```javascript
const trials = await get_trials({
  conditions: [
    "Alzheimer Disease",
    "Dementia",
    "Mild Cognitive Impairment"
  ],
  age: 70,
  state: "CA",
  phases: ["phase2", "phase3", "phase4"],
  top_n: 20
});
```

## Notes

- All parameters are optional
- The API uses intelligent defaults if parameters are not provided
- Location can be specified via city/state OR zipcode OR lat/lon
- `top_n` limits the number of results returned (recommended: 5-20)
- Results are ranked by relevance when `top_n` is specified
