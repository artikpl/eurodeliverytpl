<?php

namespace App\Controller;

use App\Route;

#[Route('/api/contacts','POST')]
class SaveContact extends AuthenticatedController
{
    public function __invoke()
    {
        return $this->apiQuery('/api/contacts', 'post', $this->app->jsonPayload);
    }
}