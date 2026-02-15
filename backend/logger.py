"""
Structured logging configuration for BrainLoop
"""
import logging
import sys
from datetime import datetime
from typing import Any

# Configure logging format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Create logger
logger = logging.getLogger("brainloop")
logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)

# Formatter
formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
console_handler.setFormatter(formatter)

# Add handler if not already added
if not logger.handlers:
    logger.addHandler(console_handler)


def log_request(method: str, path: str, status_code: int, duration_ms: float = None):
    """Log API request"""
    extra_info = f" | Duration: {duration_ms:.2f}ms" if duration_ms else ""
    logger.info(f"API Request: {method} {path} | Status: {status_code}{extra_info}")


def log_error(error: Exception, context: str = ""):
    """Log error with context"""
    context_str = f" | Context: {context}" if context else ""
    logger.error(f"Error: {str(error)}{context_str}", exc_info=True)


def log_info(message: str, **kwargs: Any):
    """Log info message with optional extra data"""
    extra = " | " + " | ".join([f"{k}: {v}" for k, v in kwargs.items()]) if kwargs else ""
    logger.info(f"{message}{extra}")
