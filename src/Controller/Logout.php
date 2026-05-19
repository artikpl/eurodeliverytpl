<?php

namespace App\Controller;

use App\Route;

#[Route('/wyloguj', 'GET')]
class Logout extends Controller
{
    public function __invoke()
    {
        $_SESSION['access_token'] = null;
        header("Location: /");
        exit;
    }
}