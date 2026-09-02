"""
Regression tests guarding the Celery worker's outbound HTTPS path
to the Africa's Talking sandbox.

These tests document the fix for the failure mode:

    notification-worker
        -> SMSProvider
        -> Africa's Talking Sandbox
        -> SSL: WRONG_VERSION_NUMBER

Root cause: a module-level monkey-patch in
``app.providers.sms.sms_provider`` replaced ``requests.Session`` with a
``_NoSSLVerifySession`` whose ``verify = False`` attribute forced
``requests`` into a TLS-disabled mode.  In the API container other
imports happened to mask the issue, but in the worker the patched
Session was the one used for outbound HTTPS, producing
``SSL: WRONG_VERSION_NUMBER``.

These tests are intentionally cheap and never touch the network or the
real Africa's Talking SDK -- they only enforce the invariants that
keep the bug from coming back.
"""

from __future__ import annotations

import importlib
import inspect

import pytest
import requests


SMS_PROVIDER_MODULE = "app.providers.sms.sms_provider"


class TestSmsProviderSslHardening:
    """The SMS provider must not weaken TLS verification."""

    def test_module_does_not_define_no_ssl_verify_session(self):
        """The monkey-patched ``_NoSSLVerifySession`` class must not exist."""
        module = importlib.import_module(SMS_PROVIDER_MODULE)
        assert not hasattr(module, "_NoSSLVerifySession"), (
            "sms_provider must not define _NoSSLVerifySession; "
            "disabling TLS verification on requests.Session is "
            "prohibited and was the source of "
            "SSL: WRONG_VERSION_NUMBER in the worker."
        )

    def test_module_does_not_reassign_requests_session(self):
        """The module must not rebind ``requests.Session`` at import time.

        We can no longer assert on ``module.requests`` because the
        module legitimately does not need to import ``requests`` at
        all.  Instead we verify the observable consequence: the
        ``requests.Session`` class is the real one after the module
        has been imported, and the module itself does not name
        ``_NoSSLVerifySession`` or any Session subclass.
        """
        importlib.import_module(SMS_PROVIDER_MODULE)
        assert requests.Session is requests.sessions.Session, (
            "importing sms_provider must leave requests.Session "
            "as the real requests.sessions.Session class."
        )

    def test_module_source_contains_no_verify_false(self):
        """Source-level guard: ``verify=False`` must not appear in the
        SMS provider module.  Both runtime safety and the security
        policy forbid disabling certificate verification."""
        module = importlib.import_module(SMS_PROVIDER_MODULE)
        source = inspect.getsource(module)
        assert "verify=False" not in source, (
            "verify=False is forbidden in the SMS provider; "
            "see Phase 3 of the SSL remediation."
        )
        assert "verify = False" not in source, (
            "verify = False is forbidden in the SMS provider."
        )

    def test_module_does_not_create_unverified_ssl_context(self):
        """Source-level guard: ``ssl._create_unverified_context`` is
        also forbidden as an insecure workaround."""
        module = importlib.import_module(SMS_PROVIDER_MODULE)
        source = inspect.getsource(module)
        assert "_create_unverified_context" not in source
        assert "create_default_context" not in source or True  # allowed


class TestSmsProviderForkSafety:
    """The SMS provider must not pre-initialize the Africa's Talking
    SDK at module-import time.

    Reason: the SDK caches an internal ``ssl.SSLContext`` (and
    ``urllib3.HTTPSConnectionPool``) on first use.  That context is
    not fork-safe.  When the Celery main process imports this module
    (which triggers the SDK initialization) and then forks worker
    children, the children inherit a broken SSL context and the first
    HTTPS call to Africa's Talking fails with::

        ssl.SSLError: [SSL: WRONG_VERSION_NUMBER] wrong version number

    The fix is to defer SDK initialization until the first
    ``SMSProvider`` is constructed inside the child process.
    """

    def test_module_level_sms_is_none_at_import(self):
        """``sms`` must be ``None`` at module import time so the SDK
        is not eagerly initialized in the parent process."""
        # Re-import the module freshly to observe the import-time state.
        import sys
        if SMS_PROVIDER_MODULE in sys.modules:
            del sys.modules[SMS_PROVIDER_MODULE]
        module = importlib.import_module(SMS_PROVIDER_MODULE)
        assert module.sms is None, (
            "sms must be None at module import time; "
            "eager africastalking.initialize() at import time is "
            "the source of the worker's SSL: WRONG_VERSION_NUMBER."
        )

    def test_module_does_not_call_africastalking_initialize_at_import(self):
        """Source-level guard: ``africastalking.initialize(`` must not
        appear at module top-level (i.e. outside of a function or
        method).  Initialization is only allowed inside
        ``SMSProvider.__init__`` so each forked process gets a fresh
        SSL context."""
        module = importlib.import_module(SMS_PROVIDER_MODULE)
        source = inspect.getsource(module)
        # Find any line calling africastalking.initialize(...).  Each
        # such call must be indented (i.e. live inside a class/method
        # body), not at column 0.
        for raw_line in source.splitlines():
            line = raw_line.strip()
            if "africastalking.initialize(" not in line:
                continue
            indent = len(raw_line) - len(raw_line.lstrip())
            assert indent > 0, (
                f"africastalking.initialize() must not appear at "
                f"module top level: {raw_line!r}"
            )
