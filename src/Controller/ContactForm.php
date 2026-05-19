<?php

namespace App\Controller;

use App\Route;

#[Route('/kontakty/(?<id>.*)', 'GET')]
class ContactForm extends AuthenticatedController
{
    public function __invoke(array $vars)
    {
        $res = $this->apiQuery('/api/contacts/' . $vars['id']);
        if ($res->code === 200) {
            $contact = $res->json->contact;
            return $this->twig->render('address.twig', [
                'address' => $contact,
            ]);
        }
        $this->addError("Nie znaleziono kontaktu w książce adresowej");
        header("Location: /kontakty");
    }
}