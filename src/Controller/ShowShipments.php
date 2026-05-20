<?php

namespace App\Controller;

abstract class ShowShipments extends AuthenticatedController
{
    public function __invoke()
    {
        $query = [
            'draft' => $this instanceof ShowDraftShipment ? 1 : 0,
        ];
        $res = $this->apiQuery('/api/shipments?'.http_build_query($query));
        return $this->twig->render('shipments.twig', [
            'shipments' => $res->json->shipments,
        ]);
    }
}