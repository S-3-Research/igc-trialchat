import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <SignIn
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