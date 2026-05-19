<?php

namespace App\Controller;

use App\Route;

#[Route(path:'/',method:'GET')]
class ShowIndex extends Controller
{
    public function __invoke()
    {
        return $this->twig->render('index.twig');
    }
}