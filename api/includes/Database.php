<?php
/**
 * Clase de conexión a la base de datos
 */

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $charset;
    public $conn;

    public function __construct() {
        $this->host = DB_HOST;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->port = DB_PORT;
        $this->charset = DB_CHARSET;
    }

    /**
     * Obtener conexión a la base de datos
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

        } catch(PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return $this->conn;
    }

    /**
     * Ejecutar query y retornar todos los resultados
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            error_log("Error en query: " . $e->getMessage());
            throw new Exception("Error al ejecutar consulta");
        }
    }

    /**
     * Ejecutar query y retornar un solo resultado
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch(PDOException $e) {
            error_log("Error en queryOne: " . $e->getMessage());
            throw new Exception("Error al ejecutar consulta ". $e->getMessage());
        }
    }

    /**
     * Ejecutar INSERT/UPDATE/DELETE
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute($params);
        } catch(PDOException $e) {
            error_log("Error en execute: " . $e->getMessage());
            throw new Exception("Error al ejecutar operación");
        }
    }

    /**
     * Obtener el último ID insertado
     */
    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }

    /**
     * Comenzar transacción
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    /**
     * Confirmar transacción
     */
    public function commit() {
        return $this->conn->commit();
    }

    /**
     * Revertir transacción
     */
    public function rollback() {
        return $this->conn->rollBack();
    }
}
