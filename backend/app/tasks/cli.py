# backend/app/tasks/cli.py

"""
Command-line interface for running scheduled tasks.

Usage:
    python -m app.tasks.cli autopilot
    python -m app.tasks.cli check_missed
    python -m app.tasks.cli reminders
    python -m app.tasks.cli optimize_schedules
    python -m app.tasks.cli health_check
    python -m app.tasks.cli weekly_reports
    python -m app.tasks.cli all
"""

import sys
import argparse
from .collective_scheduler import CollectiveScheduler


def main():
    parser = argparse.ArgumentParser(description="Run collective tasks")
    parser.add_argument(
        "task",
        choices=[
            "autopilot",
            "check_missed",
            "reminders",
            "optimize_schedules",
            "health_check",
            "weekly_reports",
            "all"
        ],
        help="Task to run"
    )

    args = parser.parse_args()
    scheduler = CollectiveScheduler()

    print(f"\n🚀 Running task: {args.task}\n")

    try:
        if args.task == "autopilot":
            result = scheduler.run_daily_autopilot()
            print(f"\n✅ Autopilot completed: {len(result)} users processed\n")

        elif args.task == "check_missed":
            result = scheduler.check_missed_shares()
            print(f"\n✅ Missed shares checked: {len(result)} processed\n")

        elif args.task == "reminders":
            result = scheduler.send_daily_reminders()
            print(f"\n✅ Reminders sent: {result['sent']} reminders\n")

        elif args.task == "optimize_schedules":
            result = scheduler.optimize_group_schedules()
            print(f"\n✅ Schedules optimized: {result['optimized']}/{result['total']} groups\n")

        elif args.task == "health_check":
            result = scheduler.analyze_group_health()
            print(f"\n✅ Health analyzed: {len(result)} groups\n")

        elif args.task == "weekly_reports":
            result = scheduler.generate_weekly_reports()
            print(f"\n✅ Reports generated: {len(result)} groups\n")

        elif args.task == "all":
            print("Running all daily tasks...\n")

            print("1️⃣ Sending reminders...")
            scheduler.send_daily_reminders()

            print("\n2️⃣ Running autopilot...")
            scheduler.run_daily_autopilot()

            print("\n3️⃣ Checking missed shares...")
            scheduler.check_missed_shares()

            print("\n4️⃣ Analyzing group health...")
            scheduler.analyze_group_health()

            print("\n✅ All tasks completed!\n")

    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
