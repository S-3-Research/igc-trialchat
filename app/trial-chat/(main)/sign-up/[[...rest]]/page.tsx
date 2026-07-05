import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <SignUp 
        appearance={{
          elements: {
            card: "shadow-lg rounded-2xl",
          },
          variables: {
            colorPrimary: "#6c47ff",
          },
        }}
      />
    </div>
  );
}