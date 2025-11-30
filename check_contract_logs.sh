#!/bin/bash
# Script para ver los logs de generación de contratos
# Uso: ./check_contract_logs.sh

echo "==================================="
echo "LOGS DE GENERACIÓN DE CONTRATOS"
echo "==================================="
echo ""

# Buscar en diferentes ubicaciones de logs
LOG_FILES=(
    "/var/log/apache2/error.log"
    "/var/log/php_errors.log"
    "/var/log/php/error.log"
    "/tmp/php_errors.log"
)

echo "Buscando logs de contrato en archivos de log..."
echo ""

for LOG_FILE in "${LOG_FILES[@]}"; do
    if [ -f "$LOG_FILE" ]; then
        echo "--- Revisando: $LOG_FILE ---"
        sudo tail -100 "$LOG_FILE" 2>/dev/null | grep -E "(GUEST REGISTRATION|CONTRACT|RESERVATION MODEL)" || echo "No se encontraron logs de contrato"
        echo ""
    fi
done

echo "==================================="
echo "LOGS DE PHP (últimas 50 líneas)"
echo "==================================="
sudo tail -50 /var/log/apache2/error.log 2>/dev/null || echo "No se puede acceder al log de Apache"

echo ""
echo "==================================="
echo "INSTRUCCIONES:"
echo "==================================="
echo "1. Registra un huésped responsable con firma"
echo "2. Ejecuta este script nuevamente: ./check_contract_logs.sh"
echo "3. Busca mensajes que comiencen con:"
echo "   - GUEST REGISTRATION:"
echo "   - CONTRACT:"
echo "   - RESERVATION MODEL:"
echo "4. Envía los logs encontrados para diagnóstico"
