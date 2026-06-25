<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ShopifyService
{
    private const API_VERSION = '2024-10';

    private string $domain;
    private string $accessToken;

    public function __construct()
    {
        $this->domain = config('services.shopify.domain', '');
        $this->accessToken = config('services.shopify.access_token', '');

        if (!$this->domain || !$this->accessToken) {
            throw new RuntimeException('Shopify non configuré (SHOPIFY_DOMAIN / SHOPIFY_ACCESS_TOKEN manquant dans .env)');
        }
    }

    public function fetchProducts(): array
    {
        $products = [];
        $url = $this->baseUrl() . '/products.json?limit=250&status=active,draft,archived';

        while ($url) {
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $this->accessToken,
                'Content-Type' => 'application/json',
            ])->timeout(30)->get($url);

            if ($response->failed()) {
                throw new RuntimeException(
                    "Erreur Shopify API ({$response->status()}): " . $response->body()
                );
            }

            $data = $response->json();
            $products = array_merge($products, $data['products'] ?? []);

            $url = $this->getNextPageUrl($response->header('Link'));
        }

        return $products;
    }

    public function getDomain(): string
    {
        return $this->domain;
    }

    private function baseUrl(): string
    {
        $domain = rtrim($this->domain, '/');

        return "https://{$domain}/admin/api/" . self::API_VERSION;
    }

    private function getNextPageUrl(?string $linkHeader): ?string
    {
        if (!$linkHeader) {
            return null;
        }

        if (preg_match('/<([^>]+)>;\s*rel="next"/', $linkHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
