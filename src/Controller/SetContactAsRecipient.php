<?php

namespace App\Controller;

use App\Route;

#[Route('/kontakty/wyslij/(?<id>.*)','GET')]
class SetContactAsRecipient extends AuthenticatedController
{
    public function __invoke(array $vars)
    {
        $res = $this->apiQuery('/api/contacts/' . $vars['id']);
        if ($res->code === 200) {
            $contact = $res->json->contact;
            $_SESSION['recipient'] = $contact;
            header("Location: /przesylki/nowa");
            exit;
        }
        $this->addError("Nie znaleziono kontaktu w książce adresowej");
        header("Location: /kontakty");
    }
}