import io
import uuid
import base64
import qrcode
from qrcode.image.pil import PilImage

def generate_secure_token() -> str:
    """Generate a high-entropy, random secure token for QR encoding."""
    # Prefix with WES-TK- and random 16 hex chars
    return f"WES-TK-{uuid.uuid4().hex[:16].upper()}"

def generate_pass_code() -> str:
    """Generate human-readable pass code like WES-004821."""
    return f"WES-{uuid.uuid4().hex[:6].upper()}"

def generate_visit_number() -> str:
    """Generate official visit record number like VIS-2026-004821."""
    return f"VIS-2026-{uuid.uuid4().hex[:6].upper()}"

def generate_qr_base64(data_payload: str) -> str:
    """Generate scannable QR Code as base64 PNG data URI."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(data_payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"
