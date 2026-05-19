<?php

namespace App\Controller;

use App\Route;

#[Route('/kontakty','GET')]
class GetContactsPage extends AuthenticatedController
{
    public function __invoke()
    {
        $res = $this->apiQuery('/api/contacts?' . http_build_query([
            'query' => $_GET['query'] ?? null
        ]));
        return $this->twig->render('addresses.twig', [
            'rows' => $res->json->contacts ?? [],
        ]);
    }
}