from prometheus_client import Counter

# A counter to track failed login attempts
LOGIN_FAILURES = Counter(
    "login_failures_total",
    "Total number of failed login attempts",
    ["username"]
)
