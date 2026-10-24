import argparse
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from data_import.importer import run_import

def main():
    parser = argparse.ArgumentParser(description="Seed SmartClass database with real ground-truth data from data.xlsx")
    parser.add_argument("--xlsx", default=config.DATA_XLSX_PATH, help="Path to data.xlsx")
    parser.add_argument("--report", default="backend/data/import_report.md", help="Path to write import report markdown")
    parser.add_argument("--credentials", default="backend/data/credentials_export.csv", help="Path to write credentials export CSV")
    parser.add_argument("--reset", action="store_true", default=True, help="Reset database schema before seeding (default)")
    parser.add_argument("--no-reset", action="store_false", dest="reset", help="Do not drop database tables before seeding")
    parser.add_argument("--with-demo-content", action="store_true", default=True, help="Seed sample study materials/assignments/quizzes tied to real courses & faculty")

    # Handle --no-reset if passed as raw argument
    if "--no-reset" in sys.argv:
        reset = False
    else:
        reset = True

    with_demo = "--without-demo-content" not in sys.argv

    args, unknown = parser.parse_known_args()

    run_import(
        xlsx_path=args.xlsx,
        report_path=args.report,
        credentials_path=args.credentials,
        reset=reset,
        with_demo_content=with_demo
    )

if __name__ == "__main__":
    main()
