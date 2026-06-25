<?php

namespace Database\Seeders;

use App\Models\Boutique;
use App\Models\Cliente;
use App\Models\ConfigMiroir;
use App\Models\Consentement;
use App\Models\Miroir;
use App\Models\Photo;
use App\Models\Produit;
use App\Models\Seance;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'Admin Kbeauty',
            'email'    => 'admin@kbeauty.fr',
            'password' => Hash::make('password'),
            'is_admin' => true,
            'role'     => 'gerant',
        ]);

        $gerant1 = User::create([
            'name'     => 'Sophie Martin',
            'email'    => 'sophie@kbeauty.fr',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'role'     => 'gerant',
        ]);

        $gerant2 = User::create([
            'name'     => 'Julie Nguyen',
            'email'    => 'julie@kbeauty.fr',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'role'     => 'gerant',
        ]);

        $collab = User::create([
            'name'     => 'Emma Petit',
            'email'    => 'emma@kbeauty.fr',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'role'     => 'collaborateur',
        ]);

        // ── Boutiques ─────────────────────────────────────────
        $boutiqueParis = Boutique::create([
            'nom'           => 'Kbeauty Paris',
            'email_contact' => 'paris@kbeauty.fr',
        ]);

        $boutiqueLyon = Boutique::create([
            'nom'           => 'Kbeauty Lyon',
            'email_contact' => 'lyon@kbeauty.fr',
        ]);

        $boutiqueBordeaux = Boutique::create([
            'nom'           => 'Kbeauty Bordeaux',
            'email_contact' => 'bordeaux@kbeauty.fr',
        ]);

        // ── Config Miroir (singleton global) ──────────────────
        // Depuis la migration 2026_04_03_021132_make_config_miroir_global_singleton,
        // config_miroir est une config GLOBALE unique (plus de boutique_id/miroir_id,
        // et miroirs n'a plus config_id). On met simplement à jour le singleton.
        $config = ConfigMiroir::global();
        $config->update([
            'couleur_primaire' => '#d4a38e',
            'couleur_fond'     => '#faf6f3',
            'typographie'      => 'Playfair Display',
            'fond_anime'       => true,
            'theme_fond_anime' => 'sakura',
            'volume'           => 40,
        ]);

        // ── Miroirs ───────────────────────────────────────────
        $miroirParis1 = Miroir::create([
            'boutique_id'       => $boutiqueParis->id,
            'nom'               => 'Miroir Accueil',
            'adresse_mac'       => 'AA:BB:CC:11:22:01',
            'token_device'      => Str::random(64),
            'en_ligne'          => true,
            'derniere_activite' => now()->subMinutes(5),
            'version_app'       => '2.1.0',
        ]);

        $miroirParis2 = Miroir::create([
            'boutique_id'       => $boutiqueParis->id,
            'nom'               => 'Miroir Cabine 1',
            'adresse_mac'       => 'AA:BB:CC:11:22:02',
            'token_device'      => Str::random(64),
            'en_ligne'          => true,
            'derniere_activite' => now()->subMinutes(12),
            'version_app'       => '2.1.0',
        ]);

        $miroirLyon = Miroir::create([
            'boutique_id'       => $boutiqueLyon->id,
            'nom'               => 'Miroir Principal',
            'adresse_mac'       => 'AA:BB:CC:33:44:01',
            'token_device'      => Str::random(64),
            'en_ligne'          => true,
            'derniere_activite' => now()->subMinutes(2),
            'version_app'       => '2.0.9',
        ]);

        $miroirBordeaux = Miroir::create([
            'boutique_id'       => $boutiqueBordeaux->id,
            'nom'               => 'Miroir Boutique',
            'adresse_mac'       => 'AA:BB:CC:55:66:01',
            'token_device'      => Str::random(64),
            'en_ligne'          => false,
            'derniere_activite' => now()->subHours(3),
            'version_app'       => '2.0.8',
        ]);

        // ── Produits ──────────────────────────────────────────
        $produits = [];
        $produitsData = [
            ['boutique_id' => $boutiqueParis->id, 'nom' => 'Sérum Vitamine C Klairs', 'description' => 'Sérum éclaircissant et anti-oxydant à la vitamine C stabilisée', 'prix' => 23.90, 'mis_en_avant' => true, 'actif' => true],
            ['boutique_id' => $boutiqueParis->id, 'nom' => 'Crème Hydratante Laneige', 'description' => 'Water Bank Blue Hyaluronic Cream — hydratation longue durée', 'prix' => 34.00, 'mis_en_avant' => true, 'actif' => true],
            ['boutique_id' => $boutiqueParis->id, 'nom' => 'Nettoyant Moussant COSRX', 'description' => 'Low pH Good Morning Gel Cleanser', 'prix' => 12.50, 'mis_en_avant' => false, 'actif' => true],
            ['boutique_id' => $boutiqueParis->id, 'nom' => 'Masque Nuit Sulwhasoo', 'description' => 'Overnight Vitalizing Mask EX à base de ginseng', 'prix' => 45.00, 'mis_en_avant' => false, 'actif' => true],
            ['boutique_id' => $boutiqueLyon->id, 'nom' => 'Essence MISSHA Time Revolution', 'description' => 'Première essence fermentée pour teint lumineux', 'prix' => 29.90, 'mis_en_avant' => true, 'actif' => true],
            ['boutique_id' => $boutiqueLyon->id, 'nom' => 'Sérum Escargot Benton', 'description' => 'Snail Bee High Content Essence — cicatrisant', 'prix' => 19.90, 'mis_en_avant' => true, 'actif' => true],
            ['boutique_id' => $boutiqueLyon->id, 'nom' => 'Crème Solaire Beauty of Joseon', 'description' => 'Relief Sun SPF50+ PA++++ — fini invisible', 'prix' => 16.50, 'mis_en_avant' => false, 'actif' => true],
            ['boutique_id' => $boutiqueBordeaux->id, 'nom' => 'Tonique AHA/BHA Some By Mi', 'description' => 'AHA BHA PHA 30 Days Miracle Toner', 'prix' => 18.00, 'mis_en_avant' => true, 'actif' => true],
            ['boutique_id' => $boutiqueBordeaux->id, 'nom' => 'Baume Nettoyant Banila Co', 'description' => 'Clean It Zero — démaquillant fondant', 'prix' => 21.00, 'mis_en_avant' => false, 'actif' => true],
        ];
        foreach ($produitsData as $p) {
            $produits[] = Produit::create($p);
        }

        // ── Clientes ──────────────────────────────────────────
        $clientesData = [
            // Paris clients
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Chloé', 'nom' => 'Dubois', 'email' => 'chloe.dubois@gmail.com', 'telephone' => '+33 6 12 34 56 78', 'date_de_naissance' => '1992-03-15', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Léa', 'nom' => 'Bernard', 'email' => 'lea.bernard@outlook.fr', 'telephone' => '+33 6 23 45 67 89', 'date_de_naissance' => '1988-07-22', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Camille', 'nom' => 'Moreau', 'email' => 'camille.moreau@yahoo.fr', 'telephone' => '+33 6 34 56 78 90', 'date_de_naissance' => '1995-11-08', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Hugo', 'nom' => 'Leroy', 'email' => 'hugo.leroy@gmail.com', 'telephone' => '+33 6 45 67 89 01', 'date_de_naissance' => '1990-01-30', 'sexe' => 'M'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Inès', 'nom' => 'Petit', 'email' => 'ines.petit@hotmail.fr', 'telephone' => '+33 6 56 78 90 12', 'date_de_naissance' => '2001-05-17', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Manon', 'nom' => 'Robert', 'email' => 'manon.robert@gmail.com', 'telephone' => '+33 7 12 34 56 78', 'date_de_naissance' => '1985-09-03', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Lucas', 'nom' => 'Richard', 'email' => 'lucas.richard@proton.me', 'telephone' => '+33 6 67 89 01 23', 'date_de_naissance' => '1998-12-25', 'sexe' => 'M'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Jade', 'nom' => 'Durand', 'email' => 'jade.durand@gmail.com', 'telephone' => '+33 6 78 90 12 34', 'date_de_naissance' => '1993-06-11', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Nathan', 'nom' => 'Simon', 'email' => 'nathan.simon@icloud.com', 'telephone' => '+33 7 23 45 67 89', 'date_de_naissance' => '1979-02-14', 'sexe' => 'M'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Sarah', 'nom' => 'Laurent', 'email' => 'sarah.laurent@gmail.com', 'telephone' => '+33 6 89 01 23 45', 'date_de_naissance' => '1996-08-20', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Éloïse', 'nom' => 'Garnier', 'email' => 'eloise.garnier@gmail.com', 'telephone' => '+33 6 90 12 34 56', 'date_de_naissance' => '2003-04-02', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Alex', 'nom' => 'Faure', 'email' => 'alex.faure@outlook.fr', 'telephone' => '+33 7 34 56 78 90', 'date_de_naissance' => '1997-10-09', 'sexe' => 'Non précisé'],

            // Lyon clients
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Amira', 'nom' => 'Benali', 'email' => 'amira.benali@gmail.com', 'telephone' => '+33 6 11 22 33 44', 'date_de_naissance' => '1991-04-18', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Clara', 'nom' => 'Fontaine', 'email' => 'clara.fontaine@yahoo.fr', 'telephone' => '+33 6 22 33 44 55', 'date_de_naissance' => '1987-12-01', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Thomas', 'nom' => 'Blanchard', 'email' => 'thomas.blanchard@gmail.com', 'telephone' => '+33 6 33 44 55 66', 'date_de_naissance' => '1994-06-28', 'sexe' => 'M'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Yasmine', 'nom' => 'Chevalier', 'email' => 'yasmine.chevalier@hotmail.fr', 'telephone' => '+33 7 44 55 66 77', 'date_de_naissance' => '2000-09-14', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Marie', 'nom' => 'Dupont', 'email' => 'marie.dupont@outlook.fr', 'telephone' => '+33 6 44 55 66 77', 'date_de_naissance' => '1983-03-07', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Romain', 'nom' => 'Girard', 'email' => 'romain.girard@proton.me', 'telephone' => '+33 6 55 66 77 88', 'date_de_naissance' => '1976-11-23', 'sexe' => 'M'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Lina', 'nom' => 'Mercier', 'email' => 'lina.mercier@gmail.com', 'telephone' => '+33 7 66 77 88 99', 'date_de_naissance' => '1999-01-11', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueLyon->id, 'prenom' => 'Soo-Jin', 'nom' => 'Park', 'email' => 'soojin.park@gmail.com', 'telephone' => '+33 6 66 77 88 99', 'date_de_naissance' => '1993-08-05', 'sexe' => 'F'],

            // Bordeaux clients
            ['boutique_id' => $boutiqueBordeaux->id, 'prenom' => 'Pauline', 'nom' => 'Roux', 'email' => 'pauline.roux@gmail.com', 'telephone' => '+33 6 77 88 99 00', 'date_de_naissance' => '1989-05-26', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueBordeaux->id, 'prenom' => 'Maxime', 'nom' => 'Lefevre', 'email' => 'maxime.lefevre@outlook.fr', 'telephone' => '+33 6 88 99 00 11', 'date_de_naissance' => '1996-02-13', 'sexe' => 'M'],
            ['boutique_id' => $boutiqueBordeaux->id, 'prenom' => 'Agathe', 'nom' => 'Morel', 'email' => 'agathe.morel@yahoo.fr', 'telephone' => '+33 7 99 00 11 22', 'date_de_naissance' => '2002-07-19', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueBordeaux->id, 'prenom' => 'Fatima', 'nom' => 'El Amrani', 'email' => 'fatima.elamrani@gmail.com', 'telephone' => '+33 6 99 00 11 22', 'date_de_naissance' => '1986-10-30', 'sexe' => 'F'],
            ['boutique_id' => $boutiqueBordeaux->id, 'prenom' => 'Lou', 'nom' => 'Gauthier', 'email' => 'lou.gauthier@icloud.com', 'telephone' => '+33 7 00 11 22 33', 'date_de_naissance' => '1998-04-04', 'sexe' => 'Non précisé'],
            ['boutique_id' => $boutiqueBordeaux->id, 'prenom' => 'Antoine', 'nom' => 'Marchand', 'email' => 'antoine.marchand@gmail.com', 'telephone' => '+33 6 01 12 23 34', 'date_de_naissance' => '1972-08-16', 'sexe' => 'M'],

            // Test client
            ['boutique_id' => $boutiqueParis->id, 'prenom' => 'Thomas', 'nom' => 'Mazeau', 'email' => 'thomas.mazeau@icloud.com', 'telephone' => '+33 6 00 00 00 00', 'date_de_naissance' => '1990-01-01', 'sexe' => 'M'],
        ];

        $clientes = [];
        $baseDate = now()->subDays(count($clientesData));
        foreach ($clientesData as $i => $c) {
            $c['created_at'] = $baseDate->copy()->addDays($i)->addHours(rand(8, 18))->addMinutes(rand(0, 59));
            $c['updated_at'] = $c['created_at'];
            $clientes[] = Cliente::create($c);
        }

        // ── Consentements & Séances ───────────────────────────
        $miroirs = [
            $boutiqueParis->id    => [$miroirParis1, $miroirParis2],
            $boutiqueLyon->id     => [$miroirLyon],
            $boutiqueBordeaux->id => [$miroirBordeaux],
        ];

        $diagnosticSamples = [
            ['hydratation' => 72, 'rides' => 15, 'taches' => 8, 'pores' => 22],
            ['hydratation' => 65, 'rides' => 28, 'taches' => 12, 'pores' => 30],
            ['hydratation' => 80, 'rides' => 10, 'taches' => 5, 'pores' => 18],
            ['hydratation' => 55, 'rides' => 35, 'taches' => 20, 'pores' => 40],
            ['hydratation' => 78, 'rides' => 8, 'taches' => 3, 'pores' => 15],
        ];

        foreach ($clientes as $idx => $cliente) {
            $boutiqueMiroirs = $miroirs[$cliente->boutique_id];
            $numSeances = ($idx % 3) + 1;

            for ($s = 0; $s < $numSeances; $s++) {
                $miroir = $boutiqueMiroirs[array_rand($boutiqueMiroirs)];
                $dateDebut = now()->subDays(rand(1, 30))->subHours(rand(0, 8))->subMinutes(rand(0, 59));
                $dateFin = (clone $dateDebut)->addMinutes(rand(15, 45));

                $consentement = Consentement::create([
                    'boutique_id'       => $cliente->boutique_id,
                    'cliente_id'        => $cliente->id,
                    'texte_consent'     => 'J\'accepte le traitement de mes données personnelles et la prise de photos à des fins de diagnostic cutané.',
                    'date_consentement' => $dateDebut,
                ]);

                $seance = Seance::create([
                    'boutique_id'     => $cliente->boutique_id,
                    'miroir_id'       => $miroir->id,
                    'cliente_id'      => $cliente->id,
                    'consentement_id' => $consentement->id,
                    'date_debut'      => $dateDebut,
                    'date_fin'        => $dateFin,
                    'note_seance'     => $s === 0 ? 'Première visite — diagnostic initial' : null,
                    'email_envoye'    => rand(0, 1) === 1,
                ]);

                $phases = ['avant', 'pendant', 'apres'];
                $numPhotos = rand(2, 3);
                for ($p = 0; $p < $numPhotos; $p++) {
                    Photo::create([
                        'seance_id'      => $seance->id,
                        'boutique_id'    => $cliente->boutique_id,
                        'chemin_local'   => "/photos/{$seance->id}_{$phases[$p]}.jpg",
                        'chemin_serveur' => "seances/{$seance->id}/{$phases[$p]}.jpg",
                        'phase'          => $phases[$p],
                        'diagnostic_ia'  => $diagnosticSamples[array_rand($diagnosticSamples)],
                        'modele_ia'      => 'skin-v2.3',
                        'latence_ms'     => rand(180, 650),
                        'synced'         => true,
                    ]);
                }

                $boutiqueProduits = array_filter($produits, fn($pr) => $pr->boutique_id === $cliente->boutique_id);
                if (!empty($boutiqueProduits)) {
                    $bpIds = array_map(fn($pr) => $pr->id, array_values($boutiqueProduits));
                    shuffle($bpIds);
                    $seance->produitsRecommandes()->attach(array_slice($bpIds, 0, min(2, count($bpIds))));
                }
            }
        }

        // Séances today for KPI
        foreach ([$clientes[0], $clientes[12], $clientes[20]] as $c) {
            $boutiqueMiroirs = $miroirs[$c->boutique_id];
            $miroir = $boutiqueMiroirs[0];
            $debut = now()->subHours(rand(1, 4));

            $consent = Consentement::create([
                'boutique_id'       => $c->boutique_id,
                'cliente_id'        => $c->id,
                'texte_consent'     => 'J\'accepte le traitement de mes données personnelles et la prise de photos à des fins de diagnostic cutané.',
                'date_consentement' => $debut,
            ]);

            $seance = Seance::create([
                'boutique_id'     => $c->boutique_id,
                'miroir_id'       => $miroir->id,
                'cliente_id'      => $c->id,
                'consentement_id' => $consent->id,
                'date_debut'      => $debut,
                'date_fin'        => (clone $debut)->addMinutes(25),
                'email_envoye'    => false,
            ]);

            Photo::create([
                'seance_id'      => $seance->id,
                'boutique_id'    => $c->boutique_id,
                'chemin_local'   => "/photos/{$seance->id}_avant.jpg",
                'chemin_serveur' => "seances/{$seance->id}/avant.jpg",
                'phase'          => 'avant',
                'diagnostic_ia'  => $diagnosticSamples[0],
                'modele_ia'      => 'skin-v2.3',
                'latence_ms'     => rand(200, 400),
                'synced'         => true,
            ]);
        }

        // Notes praticien
        $clientes[0]->update(['note_praticien' => "Peau mixte à tendance sèche. Sensibilité zones joues.\nConseil : routine hydratation matin et soir, SPF 50."]);
        $clientes[3]->update(['note_praticien' => "Peau grasse, pores dilatés zone T. Boutons inflammatoires mentonniers.\nSuivi mensuel recommandé."]);
        $clientes[12]->update(['note_praticien' => "Peau très bien hydratée. Légères ridules front.\nRoutine anti-âge légère à débuter."]);
        $clientes[20]->update(['note_praticien' => "Teint terne, manque d'éclat. Conseillé sérum vitamine C + exfoliant doux."]);
    }
}
