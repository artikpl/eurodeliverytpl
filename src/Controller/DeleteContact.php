<?php

namespace App\Controller;

use App\Route;

#[Route('/kontakty/usun/(?<id>.*)', 'GET')]
class DeleteContact extends AuthenticatedController
{
    public function __invoke(array $vars)
    {
        $res = $this->apiQuery('/api/contacts/' . $vars['id'], 'DELETE');
        if ($res->code === 200) {
            $this->addNotification("Usunięto");
        }

        $errors = $res->json->errors ?? null;
        if (is_array($errors) && count($errors) > 0) {
            foreach ($res->json->errors as $error) {
                $this->addError($error->message);
            }
        } else {
            $this->addError("Wystąpił błąd podczas usuwania kontaktu");
        }

        header("Location: /kontakty");
        exit;
    }
}