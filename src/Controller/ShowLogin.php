<?php

namespace App\Controller;

use App\Route;

#[Route('/logowanie', 'GET')]
#[Route('/logowanie/(?<rest>.*)', 'GET')]
class ShowLogin extends Controller
{
    public function __invoke($data)
    {
        $redirect = is_array($data) && isset($data['rest']) ? '/' . $data['rest'] : null;
        return $this->twig->render('login.twig', [
            'redirect' => $redirect,
        ]);
    }
}