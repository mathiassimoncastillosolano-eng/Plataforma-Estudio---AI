"""Sello de prueba: el estado de una prueba, cifrado y autenticado.

El backend no tiene base de datos (decisión de diseño del proyecto). Para que la clave de
respuestas, las explicaciones y el reloj sigan siendo del servidor, el estado completo de la
prueba viaja al navegador como un token OPACO:

- cifrado (Fernet = AES-128-CBC + HMAC-SHA256): el estudiante no puede leer las respuestas
  correctas ni las explicaciones, y no puede alterar el token sin invalidarlo;
- cada operación (iniciar, pausar, reanudar, sincronizar) devuelve un sello nuevo.

Posesión del sello = autorización sobre esa prueba (no hay sesión de usuario en el backend).
"""
import base64
import hashlib
import json
import logging
import secrets
import zlib

from cryptography.fernet import Fernet, InvalidToken

from app.pruebas.errores import PruebaInvalida

logger = logging.getLogger(__name__)

_LIMITE_BYTES_ESTADO = 2 * 1024 * 1024  # tope tras descomprimir: evita "zip bombs" con un sello manipulado


class Sellador:
    def __init__(self, secreto: str | None):
        if not secreto:
            # Sin clave fija, los sellos solo valen mientras el proceso siga vivo.
            logger.warning(
                "PRUEBAS_CLAVE_SECRETA no está definida: se usa una clave temporal y las pruebas en curso "
                "se invalidarán al reiniciar el servidor."
            )
            secreto = secrets.token_urlsafe(48)
        clave = base64.urlsafe_b64encode(hashlib.sha256(secreto.encode("utf-8")).digest())
        self._fernet = Fernet(clave)

    def sellar(self, estado: dict) -> str:
        crudo = json.dumps(estado, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        return self._fernet.encrypt(zlib.compress(crudo, 6)).decode("ascii")

    def abrir(self, sello: str) -> dict:
        try:
            comprimido = self._fernet.decrypt(sello.encode("ascii"))
            descompresor = zlib.decompressobj()
            crudo = descompresor.decompress(comprimido, _LIMITE_BYTES_ESTADO)
            if descompresor.unconsumed_tail:
                raise ValueError("estado demasiado grande")
            estado = json.loads(crudo.decode("utf-8"))
        except (InvalidToken, ValueError, zlib.error, UnicodeError) as error:
            raise PruebaInvalida(detalle=f"sello no válido ({type(error).__name__})") from error
        if not isinstance(estado, dict) or estado.get("v") != 1:
            raise PruebaInvalida(detalle="estructura de sello desconocida")
        return estado
