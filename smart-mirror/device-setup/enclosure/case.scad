// Smart Mirror enclosure — Architecture 3 pieces
// Platine VESA (fixee au miroir) + Coque (Pi inside) + Couvercle (demontable SAV)
// Voir SPECS.md pour la tracabilite des cotes.

// ============================================================================
// PARAMETRES
// ============================================================================

// Piece : "preview" | "platine" | "coque" | "couvercle" | "all"
RENDER = "preview";
OPEN   = true;   // true = eclate, false = assemble

// Profil
INCLUDE_NVME_HAT = false;

// Parois et epaisseurs
WALL              = 2.5;
TOP_THICKNESS     = 2.5;    // face coque cote platine (porte les standoffs)
COVER_THICKNESS   = 2.0;    // couvercle (face visible)
STANDOFF_HEIGHT   = 4.0;
AIRFLOW_GAP       = 6.0;
LATERAL_CLEARANCE = 3.0;

// Tolerances impression PETG
HOLE_OFFSET       = 0.25;
SLOT_OFFSET       = 0.30;

// Entrefer (piliers integres dans la platine)
SPACER_HEIGHT     = 18.0;
SPACER_OD         = 12.0;
SPACER_ID         = 4.25;   // M4 + tolerance

// VESA (miroir Shineworld)
VESA_PITCH        = 75.0;   // 75x75 standard ecrans 32"
VESA_SCREW_DIA    = 4.25;   // M4

// Pitch fixation coque sur piliers (centre sur la coque)
MOUNT_PITCH_X     = 70.0;
MOUNT_PITCH_Y     = 46.0;

// Fixation couvercle sur coque (4 vis M3 aux coins)
COVER_SCREW_DIA   = 3.25;   // M3 + tolerance
COVER_BOSS_OD     = 8.0;
COVER_SCREW_INSET = 6.0;    // distance du bord externe

// Logo
LOGO_TEXT   = "KBEAUTY";
LOGO_SIZE   = 10;
LOGO_DEPTH  = 0.8;

$fa = $preview ? 12 : 4;
$fs = $preview ? 1.2 : 0.4;

// ============================================================================
// CONSTANTES Pi 5 (datasheets Raspberry Pi)
// ============================================================================

PI_LENGTH         = 85.00;
PI_WIDTH          = 56.00;
PI_PCB_THICKNESS  = 1.60;
PI_HOLE_OFFSET    = 3.50;
PI_HOLE_PITCH_X   = 58.00;
PI_HOLE_PITCH_Y   = 49.00;

COOLER_LENGTH     = 63.50;
COOLER_WIDTH      = 42.50;
COOLER_HEIGHT     = 13.70;

HAT_STACK_HEIGHT  = 16.00;
HAT_PCB_THICKNESS = 1.60;
NVME_THICKNESS    = 4.00;

USBC_Y  = 11.20;
HDMI0_Y = 25.80;
HDMI1_Y = 39.20;

USBC_W = 9.0;   USBC_H = 3.5;
HDMI_W = 7.0;   HDMI_H = 4.0;
USBA_W = 14.5;  USBA_H = 17.0;
RJ45_W = 16.0;  RJ45_H = 14.0;

// ============================================================================
// CALCULS DERIVES
// ============================================================================

STACK_TOP = INCLUDE_NVME_HAT
    ? HAT_STACK_HEIGHT + HAT_PCB_THICKNESS + NVME_THICKNESS
    : COOLER_HEIGHT;

INNER_LENGTH = PI_LENGTH + 2 * LATERAL_CLEARANCE;
INNER_WIDTH  = PI_WIDTH  + 2 * LATERAL_CLEARANCE;
CAVITY_HEIGHT = STANDOFF_HEIGHT + PI_PCB_THICKNESS + STACK_TOP + AIRFLOW_GAP;

// Coque : face du haut (vers platine) + parois
COQUE_LENGTH = INNER_LENGTH + 2 * WALL;
COQUE_WIDTH  = INNER_WIDTH  + 2 * WALL;
COQUE_HEIGHT = TOP_THICKNESS + CAVITY_HEIGHT;

// Platine : assez large pour VESA 75x75
PLATINE_LENGTH = max(COQUE_LENGTH, VESA_PITCH + 20);
PLATINE_WIDTH  = max(COQUE_WIDTH,  VESA_PITCH + 20);
PLATINE_THICKNESS = 3.0;

// Origines Pi dans la coque (standoffs pendent du plafond de la coque)
PCB_X0 = WALL + LATERAL_CLEARANCE;
PCB_Y0 = WALL + LATERAL_CLEARANCE;
PCB_Z0 = COQUE_HEIGHT - TOP_THICKNESS - STANDOFF_HEIGHT - PI_PCB_THICKNESS;

// ============================================================================
// HELPERS
// ============================================================================

module rounded_rect(l, w, r=2.5) {
    translate([r, r])
        offset(r=r) square([l - 2*r, w - 2*r]);
}

module hex_grid_2d(area_l, area_w, hole_d=4.5, spacing=6.5) {
    rows = floor(area_w / (spacing * 0.866));
    cols = floor(area_l / spacing);
    for (i = [0:rows-1])
        for (j = [0:cols-1])
            translate([j * spacing + (i % 2) * spacing/2,
                       i * spacing * 0.866])
                circle(d=hole_d, $fn=6);
}

module pi_holes_2d(d) {
    for (x = [PI_HOLE_OFFSET, PI_HOLE_OFFSET + PI_HOLE_PITCH_X])
        for (y = [PI_HOLE_OFFSET, PI_HOLE_OFFSET + PI_HOLE_PITCH_Y])
            translate([x, y]) circle(d=d);
}

// 4 positions de fixation coque↔piliers (centre sur la coque)
module mount_pos() {
    for (dx = [-MOUNT_PITCH_X/2, MOUNT_PITCH_X/2])
        for (dy = [-MOUNT_PITCH_Y/2, MOUNT_PITCH_Y/2])
            translate([COQUE_LENGTH/2 + dx, COQUE_WIDTH/2 + dy])
                children();
}

// 4 positions VESA (centre sur la platine)
module vesa_pos() {
    for (dx = [-VESA_PITCH/2, VESA_PITCH/2])
        for (dy = [-VESA_PITCH/2, VESA_PITCH/2])
            translate([PLATINE_LENGTH/2 + dx, PLATINE_WIDTH/2 + dy])
                children();
}

// 4 positions vis couvercle (coins de la coque)
module cover_screw_pos() {
    for (x = [COVER_SCREW_INSET, COQUE_LENGTH - COVER_SCREW_INSET])
        for (y = [COVER_SCREW_INSET, COQUE_WIDTH - COVER_SCREW_INSET])
            translate([x, y]) children();
}

// ============================================================================
// COMPOSANTS FANTOMES (visibles F5/F6, exclus du STL via %)
// ============================================================================

module pi5_reference() {
    color("#1a7a3a", 0.5)
        cube([PI_LENGTH, PI_WIDTH, PI_PCB_THICKNESS]);
    color("Silver", 0.5)
        translate([(PI_LENGTH - COOLER_LENGTH)/2,
                   (PI_WIDTH  - COOLER_WIDTH)/2,
                   PI_PCB_THICKNESS])
            cube([COOLER_LENGTH, COOLER_WIDTH, COOLER_HEIGHT]);
}

// ============================================================================
// PIECE 1 : PLATINE VESA (se visse au miroir, porte tout)
// ============================================================================

module platine_vesa() {
    offset_x = (PLATINE_LENGTH - COQUE_LENGTH) / 2;
    offset_y = (PLATINE_WIDTH  - COQUE_WIDTH)  / 2;

    difference() {
        union() {
            // Plaque principale
            linear_extrude(PLATINE_THICKNESS)
                rounded_rect(PLATINE_LENGTH, PLATINE_WIDTH);

            // 4 piliers integres (pointent vers le bas = -Z en impression,
            // mais on les modele vers +Z et on retourne a l'assemblage)
            translate([offset_x, offset_y, -SPACER_HEIGHT])
                mount_pos()
                    cylinder(d=SPACER_OD, h=SPACER_HEIGHT + 0.1);
        }

        // Trous VESA M4 (traversent la plaque, pour visser au miroir)
        vesa_pos()
            translate([0, 0, -0.1])
                cylinder(d=VESA_SCREW_DIA, h=PLATINE_THICKNESS + 0.2);

        // Trous M4 dans les piliers (insert laiton, la coque se visse ici)
        translate([offset_x, offset_y, -SPACER_HEIGHT - 0.1])
            mount_pos()
                cylinder(d=SPACER_ID, h=SPACER_HEIGHT + PLATINE_THICKNESS + 0.2);

        // Ventilation entre les piliers (air chaud s'echappe lateralement)
        translate([offset_x + COQUE_LENGTH/2 - 20,
                   offset_y + COQUE_WIDTH/2 - 15,
                   -0.1])
            linear_extrude(PLATINE_THICKNESS + 0.2)
                hex_grid_2d(40, 30, hole_d=5, spacing=7);
    }
}

// ============================================================================
// PIECE 2 : COQUE (contient le Pi, ouverte par le bas)
// ============================================================================

module coque() {
    cz = PCB_Z0 + PI_PCB_THICKNESS;

    difference() {
        union() {
            // Parois (ouvertes par le bas, fermees par le haut)
            linear_extrude(COQUE_HEIGHT)
                difference() {
                    rounded_rect(COQUE_LENGTH, COQUE_WIDTH);
                    translate([WALL, WALL])
                        square([INNER_LENGTH, INNER_WIDTH]);
                }

            // Plafond (face vers platine/ecran)
            translate([0, 0, COQUE_HEIGHT - TOP_THICKNESS])
                linear_extrude(TOP_THICKNESS)
                    rounded_rect(COQUE_LENGTH, COQUE_WIDTH);

            // Standoffs M2.5 (pendent du plafond vers le bas)
            translate([PCB_X0, PCB_Y0,
                       COQUE_HEIGHT - TOP_THICKNESS - STANDOFF_HEIGHT])
                linear_extrude(STANDOFF_HEIGHT + 0.1)
                    pi_holes_2d(d=6);

            // 4 bosses pour vis couvercle M3 (bas des parois)
            cover_screw_pos()
                cylinder(d=COVER_BOSS_OD, h=8);
        }

        // Percages standoffs M2.5 (insert laiton, Pi se visse par-dessous)
        translate([PCB_X0, PCB_Y0,
                   COQUE_HEIGHT - TOP_THICKNESS - STANDOFF_HEIGHT - 0.1])
            linear_extrude(STANDOFF_HEIGHT + TOP_THICKNESS + 0.2)
                pi_holes_2d(d=2.5 + HOLE_OFFSET);

        // Trous M4 dans le plafond (vis vers les piliers de la platine)
        mount_pos()
            translate([0, 0, COQUE_HEIGHT - TOP_THICKNESS - 0.1])
                cylinder(d=SPACER_ID, h=TOP_THICKNESS + 0.2);

        // Grille exhaust dans le plafond (air chaud sort vers l'entrefer)
        translate([COQUE_LENGTH/2 - 25, COQUE_WIDTH/2 - 18,
                   COQUE_HEIGHT - TOP_THICKNESS - 0.1])
            linear_extrude(TOP_THICKNESS + 0.2)
                hex_grid_2d(50, 36, hole_d=5, spacing=7);

        // Percages vis couvercle M3 (insert laiton)
        cover_screw_pos()
            translate([0, 0, -0.1])
                cylinder(d=COVER_SCREW_DIA, h=8.2);

        // --- Cutouts connecteurs (dans les parois) ---

        // Bord nord : USB-C alim + 2x micro-HDMI
        translate([COQUE_LENGTH - WALL - 0.5,
                   PCB_Y0 + USBC_Y - (USBC_W + SLOT_OFFSET)/2,
                   cz - SLOT_OFFSET])
            cube([WALL + 1, USBC_W + SLOT_OFFSET, USBC_H + 2*SLOT_OFFSET]);
        for (hy = [HDMI0_Y, HDMI1_Y])
            translate([COQUE_LENGTH - WALL - 0.5,
                       PCB_Y0 + hy - (HDMI_W + SLOT_OFFSET)/2,
                       cz - SLOT_OFFSET])
                cube([WALL + 1, HDMI_W + SLOT_OFFSET, HDMI_H + 2*SLOT_OFFSET]);

        // Bord est : 2x USB-A pair + RJ45
        for (xc = [PCB_X0 + 27, PCB_X0 + 45])
            translate([xc - (USBA_W + SLOT_OFFSET)/2,
                       COQUE_WIDTH - WALL - 0.5,
                       cz - SLOT_OFFSET])
                cube([USBA_W + SLOT_OFFSET, WALL + 1, USBA_H + 2*SLOT_OFFSET]);
        translate([PCB_X0 + 65 - (RJ45_W + SLOT_OFFSET)/2,
                   COQUE_WIDTH - WALL - 0.5,
                   cz - SLOT_OFFSET])
            cube([RJ45_W + SLOT_OFFSET, WALL + 1, RJ45_H + 2*SLOT_OFFSET]);

        // Bord sud : acces microSD
        translate([-0.5, PCB_Y0 + PI_WIDTH/2 - 8, PCB_Z0 - 2])
            cube([WALL + 1, 16, 4]);
    }
}

// ============================================================================
// PIECE 3 : COUVERCLE (face visible, demontable pour SAV)
// ============================================================================

module couvercle() {
    difference() {
        union() {
            // Plaque
            linear_extrude(COVER_THICKNESS)
                rounded_rect(COQUE_LENGTH, COQUE_WIDTH);
            // Lip male (rentre dans la coque pour centrage)
            translate([WALL + 0.3, WALL + 0.3, COVER_THICKNESS])
                cube([INNER_LENGTH - 0.6, INNER_WIDTH - 0.6, 1.6]);
        }

        // Grille intake (air frais entre par ici)
        translate([COQUE_LENGTH/2 - 25, COQUE_WIDTH/2 - 18, -0.1])
            linear_extrude(COVER_THICKNESS + 0.2)
                hex_grid_2d(50, 36, hole_d=5, spacing=7);

        // Logo KBEAUTY grave (face exterieure = z=0)
        translate([COQUE_LENGTH/2, 12, -0.1])
            linear_extrude(LOGO_DEPTH + 0.1)
                text(LOGO_TEXT, size=LOGO_SIZE,
                     font="Liberation Sans:style=Bold",
                     halign="center", valign="center");

        // 4 trous M3 (vis depuis l'exterieur vers la coque)
        cover_screw_pos()
            translate([0, 0, -0.1])
                cylinder(d=COVER_SCREW_DIA, h=COVER_THICKNESS + 2);
    }
}

// ============================================================================
// ASSEMBLAGE
// ============================================================================

module preview() {
    platine_offset_x = (PLATINE_LENGTH - COQUE_LENGTH) / 2;
    platine_offset_y = (PLATINE_WIDTH  - COQUE_WIDTH)  / 2;

    if (OPEN) {
        // Vue eclatee : 3 pieces cote a cote
        coque();
        %translate([PCB_X0, PCB_Y0, PCB_Z0]) pi5_reference();

        translate([COQUE_LENGTH + 15, 0, 0])
            couvercle();

        translate([0, COQUE_WIDTH + 15, SPACER_HEIGHT])
            platine_vesa();
    } else {
        // Assemble : platine en haut, coque au milieu, couvercle en bas
        // Platine au-dessus (piliers pointent vers le bas = vers la coque)
        translate([-platine_offset_x, -platine_offset_y,
                   COQUE_HEIGHT + SPACER_HEIGHT])
            platine_vesa();

        // Coque
        coque();
        %translate([PCB_X0, PCB_Y0, PCB_Z0]) pi5_reference();

        // Couvercle en bas (retourne, lip vers le haut)
        translate([0, 0, -COVER_THICKNESS])
            couvercle();
    }
}

// ============================================================================
// RENDU
// ============================================================================

if      (RENDER == "platine")   platine_vesa();
else if (RENDER == "coque")     coque();
else if (RENDER == "couvercle") couvercle();
else if (RENDER == "all") {
    coque();
    translate([COQUE_LENGTH + 15, 0, 0]) couvercle();
    translate([0, COQUE_WIDTH + 15, 0])  platine_vesa();
}
else preview();

echo("=== Smart Mirror enclosure v2 ===");
echo(str("Coque (mm)       : ", COQUE_LENGTH, " x ", COQUE_WIDTH, " x ", COQUE_HEIGHT));
echo(str("Platine (mm)     : ", PLATINE_LENGTH, " x ", PLATINE_WIDTH, " x ", PLATINE_THICKNESS));
echo(str("Couvercle (mm)   : ", COQUE_LENGTH, " x ", COQUE_WIDTH, " x ", COVER_THICKNESS));
echo(str("Entrefer (mm)    : ", SPACER_HEIGHT));
echo(str("Total dos ecran  : ", COQUE_HEIGHT + SPACER_HEIGHT + PLATINE_THICKNESS, " mm"));
echo(str("VESA pitch       : ", VESA_PITCH, " mm"));
echo(str("Imprimante OK    : ",
    max(PLATINE_LENGTH, COQUE_LENGTH) < 256
    && max(PLATINE_WIDTH, COQUE_WIDTH) < 256 ? "OUI" : "NON"));
