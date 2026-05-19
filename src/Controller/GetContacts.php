<?php

namespace App\Controller;

use App\Route;

#[Route('/api/contacts','GET')]
class GetContacts extends AuthenticatedController
{
    public function __invoke()
    {
        return $this->apiQuery(
            '/api/contacts?'.http_build_query([
                'query' => $_GET['query'] ?? null
            ])
        );
    }
}