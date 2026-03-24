<?php
class Settings {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function getByName($name) {
        $sql = "SELECT properties FROM settings WHERE name = ?";
        return $this->db->queryOne($sql, [$name]);
    }

    public function getEmailConfig() {
        $settings = $this->getByName('email');
        if (!$settings || empty($settings['properties'])) {
            return null;
        }
        return json_decode($settings['properties'], true);
    }
}
