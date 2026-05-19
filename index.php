<?php

use App\App;
session_start();
ini_set('display_errors', 1);
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
require_once("vendor/autoload.php");
new App()();