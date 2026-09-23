from attendance import calculate_attendance, check_eligibility


def test_attendance_calculation():
    assert calculate_attendance(36, 40) == 90.0


def test_eligible_student():
    assert check_eligibility(36, 40) is True


def test_not_eligible_student():
    assert check_eligibility(20, 40) is False


def test_zero_total_classes():
    assert calculate_attendance(0, 0) == 0
