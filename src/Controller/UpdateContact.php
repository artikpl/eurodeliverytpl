<?php

namespace App\Controller;

use App\Route;

#[Route('/api/contacts/(?<id>.*)', 'PATCH')]
class UpdateContact extends AuthenticatedController
{
    public function __invoke(array $vars)
    {
        return $this->apiQuery('/api/contacts/' . $vars['id'],'PATCH', $this->app->jsonPayload);
    }
}