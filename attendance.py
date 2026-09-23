def calculate_attendance(present, total):
    if total == 0:
        return 0

    return (present / total) * 100


def check_eligibility(present, total, minimum=75):
    attendance = calculate_attendance(present, total)
    return attendance >= minimum


if __name__ == "__main__":
    present = 36
    total = 40

    attendance = calculate_attendance(present, total)

    print("SmartClass Attendance System")
    print("Attendance:", attendance, "%")
    print("Eligible:", check_eligibility(present, total))
