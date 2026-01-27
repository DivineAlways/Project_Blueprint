import os
import subprocess

class ProjectManagerAgent:
    """
    The orchestrator for the Universal AI-PM System.
    Handles self-correction by reading verification reports and identifying errors.
    """
    def __init__(self):
        self.report_path = "VERIFICATION_REPORT.md"

    def run_verification(self):
        """Executes the verification script."""
        print("🚀 Running verification...")
        try:
            subprocess.run(["bash", "scripts/verify_build.sh"], check=True)
            return True
        except Exception as e:
            print(f"❌ Verification failed: {e}")
            return False

    def analyze_report(self):
        """Reads the report and identifies failing files."""
        if not os.path.exists(self.report_path):
            return []

        erroring_files = []
        try:
            with open(self.report_path, "r") as f:
                lines = f.readlines()

            for line in lines:
                if "❌" in line:
                    # Look for file paths in the error line
                    parts = line.split(" ")
                    for p in parts:
                        p_clean = p.replace(":", "").strip()
                        if "/" in p_clean and any(ext in p_clean for ext in [".py", ".ts", ".sql", ".js"]):
                            erroring_files.append(p_clean)
        except Exception as e:
            print(f"Error reading report: {e}")
        
        return list(set(erroring_files))

    def attempt_fix(self, failing_files):
        """Logic for self-correction: Read file -> Generate Fix -> Verify."""
        if not failing_files:
            print("✅ No failing files found to fix.")
            return

        print(f"🛑 Found {len(failing_files)} failing files: {', '.join(failing_files)}")
        for file_path in failing_files:
            print(f"🛠 Analyzing {file_path} for potential fixes...")
            # In a full autonomous loop, the agent would now read this file
            # and request a fix from the LLM.
            pass

if __name__ == "__main__":
    pm = ProjectManagerAgent()
    pm.run_verification()
    failures = pm.analyze_report()
    pm.attempt_fix(failures)
