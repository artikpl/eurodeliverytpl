<?php

namespace App\Controller;

use App\Route;

#[Route('/kontakty/nowy','GET')]
class NewContactForm extends AuthenticatedController
{
    public function __invoke()
    {
        return $this->twig->render('address.twig');
    }
}