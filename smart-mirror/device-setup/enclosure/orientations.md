# Orientations boitier Smart Mirror — Diagrammes comparatifs

## Contexte commun

```mermaid
graph LR
    subgraph Mur
        direction LR
    end
    subgraph Installation["Vue de cote (coupe horizontale)"]
        direction LR
        CLIENT["Client\n(piece)"] --- VERRE["Verre\nsans-tain"]
        VERRE --- ECRAN["Ecran\n32 pouces"]
        ECRAN --- DOS["Dos\necran"]
        DOS --- ENTREFER["Entrefer\n18mm"]
        ENTREFER --- BOITIER["Boitier\nPi 5"]
        BOITIER --- MUR2["Mur"]
    end
    style ENTREFER fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style BOITIER fill:#fff3e0,stroke:#ff9800,stroke-width:2px
```

---

## Possibilite 1 — Ouverture vers le mur

```mermaid
graph TB
    subgraph P1["Vue de cote — Ouverture vers le mur"]
        direction LR
        ECRAN1["Dos ecran\n(chaud 35-50C)"]
        SPACER1["Entretoises\nVESA\n18mm"]
        FOND1["Coque\n(fond ferme\n+ grille exhaust)"]
        PI1["Pi 5\n+ Cooler"]
        COUV1["Couvercle\n(demontable)\ngrille intake"]
        MUR1["Mur"]

        ECRAN1 --> SPACER1
        SPACER1 --> FOND1
        FOND1 --- PI1
        PI1 --> COUV1
        COUV1 --> MUR1
    end

    subgraph AIR1["Flux thermique"]
        direction LR
        A1["Air mur\n(stagnant)"] -->|intake| B1["Pi"] -->|exhaust| C1["Entrefer"]
    end

    subgraph EVAL1["Evaluation"]
        S1["Solidite : ++ gravite neutre"]
        T1["Temperature : + air mur stagnant"]
        SAV1["SAV : -- si miroir colle au mur"]
        CAB1["Cables : + sortent par les tranches"]
    end

    style FOND1 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style COUV1 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,stroke-dasharray: 5 5
    style S1 fill:#c8e6c9
    style T1 fill:#fff9c4
    style SAV1 fill:#ffcdd2
    style CAB1 fill:#c8e6c9
```

---

## Possibilite 2 — Ouverture vers le bas

```mermaid
graph TB
    subgraph P2["Vue de face — Ouverture vers le bas"]
        direction TB
        VESA2["Platine VESA\n(fixee au miroir)"]
        SPACER2["Entretoises"]
        TOP2["Coque haut\n(grille exhaust\nair chaud monte)"]
        PI2["Pi 5\n+ Cooler"]
        COUV2["Couvercle bas\n(demontable)\ngrille intake + logo\n4 vis M3"]
        SOL2["Sol"]

        VESA2 --> SPACER2
        SPACER2 --> TOP2
        TOP2 --- PI2
        PI2 --> COUV2
        COUV2 -.->|gravite| SOL2
    end

    subgraph AIR2["Flux thermique"]
        direction TB
        A2["Air frais\n(monte du sol)"] -->|intake bas| B2["Pi"] -->|exhaust haut| C2["Entrefer\n+ plafond"]
    end

    subgraph EVAL2["Evaluation"]
        S2["Solidite : - gravite tire le couvercle"]
        T2["Temperature : +++ convection naturelle"]
        SAV2["SAV : +++ espace libre sous miroir"]
        CAB2["Cables : +++ sortent par le bas"]
    end

    style TOP2 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style COUV2 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,stroke-dasharray: 5 5
    style S2 fill:#ffcdd2
    style T2 fill:#c8e6c9
    style SAV2 fill:#c8e6c9
    style CAB2 fill:#c8e6c9
```

---

## Possibilite 3 — Ouverture vers le haut

```mermaid
graph TB
    subgraph P3["Vue de face — Ouverture vers le haut"]
        direction TB
        PLAFOND3["Plafond"]
        COUV3["Couvercle haut\n(demontable)\nBLOQUE l air chaud"]
        PI3["Pi 5\n+ Cooler"]
        FOND3["Coque bas\n(fond ferme\ngrille intake)"]
        SPACER3["Entretoises"]
        VESA3["Platine VESA"]

        PLAFOND3 -.-> COUV3
        COUV3 --- PI3
        PI3 --- FOND3
        FOND3 --> SPACER3
        SPACER3 --> VESA3
    end

    subgraph AIR3["Flux thermique"]
        direction TB
        A3["Air frais\npar le bas"] -->|intake| B3["Pi"] -->|BLOQUE| C3["Couvercle\nemprisonne\nla chaleur"]
    end

    subgraph EVAL3["Evaluation"]
        S3["Solidite : +++ gravite maintient couvercle"]
        T3["Temperature : -- air chaud piege"]
        SAV3["SAV : - difficile si miroir haut"]
        CAB3["Cables : ++ sortent par le bas"]
    end

    style FOND3 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style COUV3 fill:#ffcdd2,stroke:#f44336,stroke-width:2px,stroke-dasharray: 5 5
    style S3 fill:#c8e6c9
    style T3 fill:#ffcdd2
    style SAV3 fill:#ffcdd2
    style CAB3 fill:#c8e6c9
```

---

## Possibilite 4 — Ouverture vers l ecran

```mermaid
graph TB
    subgraph P4["Vue de cote — Ouverture vers ecran"]
        direction LR
        ECRAN4["Dos ecran"]
        SPACER4["Entretoises"]
        COUV4["Couvercle\n(demontable)\ngrille exhaust"]
        PI4["Pi 5\n+ Cooler"]
        FOND4["Coque\n(fond visible)\ngrille intake\n+ logo"]
        MUR4["Mur"]

        ECRAN4 --> SPACER4
        SPACER4 --> COUV4
        COUV4 --- PI4
        PI4 --> FOND4
        FOND4 --> MUR4
    end

    subgraph AIR4["Flux thermique"]
        direction LR
        A4["Air piece\n(cote mur)"] -->|intake| B4["Pi"] -->|exhaust| C4["Entrefer"]
    end

    subgraph EVAL4["Evaluation"]
        S4["Solidite : +++ coque pend fermee"]
        T4["Temperature : ++ exhaust dans entrefer"]
        SAV4["SAV : -- faut demonter du VESA"]
        CAB4["Cables : + sortent par les tranches"]
    end

    style FOND4 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style COUV4 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,stroke-dasharray: 5 5
    style S4 fill:#c8e6c9
    style T4 fill:#c8e6c9
    style SAV4 fill:#ffcdd2
    style CAB4 fill:#c8e6c9
```

---

## Comparatif final

```mermaid
graph LR
    subgraph SCORE["Score comparatif"]
        direction TB
        H["Critere"]
        H1["1. Vers mur"]
        H2["2. Vers bas"]
        H3["3. Vers haut"]
        H4["4. Vers ecran"]

        SOL["Solidite"]
        SOL1["++"]
        SOL2["-"]
        SOL3["+++"]
        SOL4["+++"]

        TEMP["Temperature"]
        TEMP1["+"]
        TEMP2["+++"]
        TEMP3["--"]
        TEMP4["++"]

        SAV["SAV"]
        SAV_1["--"]
        SAV_2["+++"]
        SAV_3["-"]
        SAV_4["--"]

        CABLE["Cables"]
        CABLE1["+"]
        CABLE2["+++"]
        CABLE3["++"]
        CABLE4["+"]

        TOTAL["TOTAL"]
        TOT1["4/12"]
        TOT2["10/12"]
        TOT3["5/12"]
        TOT4["8/12"]
    end

    style TOT2 fill:#c8e6c9,stroke:#4caf50,stroke-width:3px
    style H2 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
```
