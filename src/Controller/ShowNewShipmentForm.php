<?php

namespace App\Controller;

use App\Route;

#[Route('/przesylki/nowa','GET')]
class ShowNewShipmentForm extends ShowShipmentForm
{
    public function __invoke($data)
    {
        $account = $this->getAccount();
        $sender = $account->addresses->sender ?? $account->addresses->billing;
        $shipment = [];
        $recipient = $_SESSION['recipient'] ?? null;
        return $this->twig->render('new-shipment.twig', [
            'sender' => $sender,
            'shipment' => $shipment,
            'recipient' => $recipient,
        ]);
    }
}