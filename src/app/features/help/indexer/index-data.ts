type HelpIndexData = {
  id: string,
  title: string,
  text: string,
};

export const HELP_INDEX_DATA: HelpIndexData[] = [
  {
    id: 'glos_aashto',
    title: 'AASHTO',
    text: 'AASHTO is the American Association of State Highway and Transportation Officials, the governing body' +
          ' that writes and publishes design codes for all highway bridges in the United States.'
  },
  {
    id: 'glos_abutment',
    title: 'Abutment',
    text: 'An abutment is a stone or concrete wall that supports one end of a bridge span . The abutment also a' +
          'cts as a retaining wall, holding back the earth embankments at the approaches to the bridge. An abut' +
          'ment is part of the substructure of a bridge.'
  },
  {
    id: 'glos_anchorages',
    title: 'Anchorages',
    text: 'An anchorage is a foundation structure to which the cables of a suspension bridge are connected. Bec' +
          'ause the cables support most of the weight of a suspension bridge, anchorages are generally very mas' +
          'sive and often extend far below the surface of the earth. In the Bridge Designer, anchorages are rep' +
          'resented by pinned supports.'
  },
  {
    id: 'glos_arch_abutments',
    title: 'Arch abutments',
    text: 'In the Bridge Designer, arch abutments are substructure elements that use arch supports to hold up t' +
          'he bridge and transmit its weight to the soil below.'
  },
  {
    id: 'glos_arch_supports',
    title: 'Arch supports',
    text: 'Arch supports consist of a pin at each end of the span . Arch supports allow for no lateral movement' +
          ' of the bridge and thus provide more restraint than simple supports .'
  },
  {
    id: 'glos_asphalt',
    title: 'Asphalt',
    text: 'Asphalt is a mixture of gravel and bitumen, a by-product of the petroleum refining process. Asphalt ' +
          'is commonly used as a pavement and as a wearing surface for bridge decks.'
  },
  {
    id: 'glos_astm',
    title: 'ASTM',
    text: 'The American Society for Testing Materials (ASTM) is a not-for-profit organization, through which ma' +
          'nufacturers, consumers, researchers, and government officials write standards for the production, te' +
          'sting, and use of building materials. ASTM standards ensure that all materials have uniformly unders' +
          'tood engineering properties and an appropriate level of quality.'
  },
  {
    id: 'glos_bearing',
    title: 'Bearing',
    text: 'A bearing is another word for a support. Supports are joints at which a structure is attached to its' +
          ' foundation.'
  },
  {
    id: 'glos_bridge_design_file',
    title: 'Bridge design file',
    text: 'A bridge design file is a specially formatted text file created by the Bridge Designer to save a bri' +
          'dge design for future use.'
  },
  {
    id: 'glos_buckling',
    title: 'Buckling',
    text: 'Buckling is the principal failure mode of a member that is loaded in compression . When a member buc' +
          'kles, it bends sideways as it is compressed axially. The failure is usually sudden and catastrophic.' +
          ' Members that are long and slender are particularly susceptible to buckling.'
  },
  {
    id: 'glos_cable_anchorages',
    title: 'Cable anchorages',
    text: 'A cable anchorage is a foundation structure to which the cables of a suspension bridge are connected' +
          '. Because the cables support most of the weight of a suspension bridge, anchorages are generally ver' +
          'y massive and often extend far below the surface of the earth. In the Bridge Designer, cable anchora' +
          'ges are represented by pinned supports.'
  },
  {
    id: 'glos_chords',
    title: 'Chords',
    text: 'Chords are the main horizontal load-carrying members of a truss. In a truss bridge, the top chords n' +
          'ormally carry compression , while the bottom chords normally carry tension'
  },
  {
    id: 'glos_client',
    title: 'Client',
    text: 'A client is a person or organization that hires a professional (like an engineer, a doctor, or a law' +
          'yer) to perform a specialized service.'
  },
  {
    id: 'glos_compression',
    title: 'Compression',
    text: 'Compression is an internal axial member force that tends to >>>shorten<<< a member.'
  },
  {
    id: 'glos_concrete',
    title: 'Concrete',
    text: 'Concrete is a mixture of portland cement, sand, gravel, and water. When concrete hardens, it forms a' +
          ' solid, rock-like substance that can be used to build many kinds of structures.'
  },
  {
    id: 'glos_connections',
    title: 'Connections',
    text: 'A connection is an assembly of steel plates, bolts, and/or welds that attach two or more members tog' +
          'ether in an actual structure. Connections in a real structure are represented by joints in a structu' +
          'ral model .'
  },
  {
    id: 'glos_cut',
    title: 'Cut',
    text: 'A cut is an excavation that lowers the elevation of a roadway below the existing surface of the land' +
          '.'
  },
  {
    id: 'glos_deck',
    title: 'Deck',
    text: 'The deck is the floor of a bridge. It directly supports the vehicles and pedestrians that cross the ' +
          'bridge. Bridge decks are usually made of reinforced concrete .'
  },
  {
    id: 'glos_deck_truss',
    title: 'Deck truss',
    text: 'A deck truss is a truss with its deck is located at the top chord. Vehicles crossing deck trusses ar' +
          'e supported above the trusses.'
  },
  {
    id: 'glos_diagonals',
    title: 'Diagonals',
    text: 'Diagonals are truss members that are oriented diagonally. Usually they connect the top and bottom ch' +
          'ords together.'
  },
  {
    id: 'glos_displacement',
    title: 'Displacement',
    text: 'A displacement is the movement of a joint that occurs when loads are applied to the structure.'
  },
  {
    id: 'glos_drawing_grid',
    title: 'Drawing grid',
    text: 'The drawing grid is like a piece of graph paper on your Drawing Board. The grid is made up of two se' +
          'ts of parallel lines, one horizontal and one vertical. The lines are spaced 0.25, 0.5, or 1.0 meters' +
          ' apart, depending on the current grid resolution setting. The intersections of the grid lines are ca' +
          'lled snap points . The grid lines are not visible, but their locations are indicated by the marks on' +
          ' the vertical and horizontal rulers located on the left and bottom edges of the Drawing Board.'
  },
  {
    id: 'glos_dynamic_load_allowance',
    title: 'Dynamic load allowance',
    text: 'The Dynamic Load Allowance is a factor used in bridge design to represent the effect of moving loads' +
          ' . The Bridge Designer uses a Dynamic Load Allowance of 33%. This means that a moving truck causes 3' +
          '3% more force in the bridge members than a stationary truck would cause.'
  },
  {
    id: 'glos_floor_beams',
    title: 'Floor beams',
    text: 'Floor beams are transverse members that support the bridge deck and transmit loads from the deck to ' +
          'the joints of the main trusses.'
  },
  {
    id: 'glos_footing',
    title: 'Footing',
    text: 'A footing is the base of an abutment or pier --the portion a foundation that rests directly on the s' +
          'oil and transmits load from the structure to the soil.'
  },
  {
    id: 'glos_forces',
    title: 'Forces',
    text: 'A force is a push or a pull. Weight is a common example of a force. Force is measured in pounds (in ' +
          'the U.S. system of measurement) or newtons (in the SI system). In the Bridge Designer, all forces ar' +
          'e reported in kilonewtons (kN).'
  },
  {
    id: 'glos_joints',
    title: 'Joints',
    text: 'A joint is a point at which the ends of two or more members are connected together. In a truss, a jo' +
          'int is assumed to act like a frictionless pin or hinge; it does not prevent the connected members fr' +
          'om rotating with respect to each other.'
  },
  {
    id: 'glos_kilonewton',
    title: 'Kilonewton',
    text: 'A kilonewton (kN) is a measurement of force in the SI (metric) system. A kilonewton is 1000 newtons.'
  },
  {
    id: 'glos_kn',
    title: 'kN',
    text: `kN is the abbreviation for kilonewton , a metric unit of force. It's equivalent to about 225 pounds.`
  },
  {
    id: 'glos_load_factors',
    title: 'Load factors',
    text: 'A load factor is a number (normally greater than 1) which is multiplied by a design load in order to' +
          ' represent an extreme loading experienced by a structure. For example, the load factor 1.75 is multi' +
          'plied by the standard AASHTO H25 Truck Loading to represent an extremely heavy truck. In fact, it re' +
          'presents the heaviest truck that might reasonably be expected to cross the bridge in its lifetime. D' +
          'ifferent kinds of loads have different load factors, because some loads are more unpredictable than ' +
          'others. For example, the weight of the bridge is more predictable than the weight of a heavy truck, ' +
          'so the load factor for bridge weight is much lower.'
  },
  {
    id: 'glos_load_test',
    title: 'Load test',
    text: 'In the Bridge Designer, the load test is a simulated test of how well your design would perform if i' +
          't were built and placed into service. In the load test, your bridge is subjected to its own self-wei' +
          'ght and to the weight of a standard AASHTO H25 truck loading, and every member in the structural mod' +
          'el is checked for structural safety .'
  },
  {
    id: 'glos_loads',
    title: 'Loads',
    text: 'Loads are forces applied to a structure. On a highway bridge, the loads include the weight of vehicl' +
          'es that cross the bridge, the weight of the bridge itself, and, in some cases, the weight of snow an' +
          'd ice on the structure, and the forces caused by high winds and earthquakes.'
  },
  {
    id: 'glos_mass_density',
    title: 'Mass density',
    text: 'The mass density of a material is its mass per unit volume. The mass density of steel is significant' +
          'ly higher than that of concrete or asphalt .'
  },
  {
    id: 'glos_member_force',
    title: 'Member force',
    text: 'The member force is the internal force developed in a member as a result of loads applied to the str' +
          'ucture. The member force can be either tension or compression .'
  },
  {
    id: 'glos_member_numbers',
    title: 'Member numbers',
    text: 'Every member in your structural model has a member number. The numbers are assigned in the order tha' +
          't you create the members . They have no other physical significance. Member numbers are used only fo' +
          'r reference--member properties and load test results are reported by member number in the Member Lis' +
          't.'
  },
  {
    id: 'glos_member_properties',
    title: 'Member properties',
    text: 'The properties of a member are (1) the material it is made of, (2) the type of cross-section, and (3' +
          ') the member size .'
  },
  {
    id: 'glos_member_size',
    title: 'Member size',
    text: 'The size of a member is represented by the dimensions of its cross-section, in millimeters.'
  },
  {
    id: 'glos_members',
    title: 'Members',
    text: 'Members are the individual structural elements that make up a truss. Members are connected to each o' +
          'ther at joints .'
  },
  {
    id: 'glos_modulus_of_elasticity',
    title: 'Modulus of elasticity',
    text: `The modulus of elasticity is a measure of a material's stiffness--its resistance to deformation. A m` +
          'aterial with a high modulus of elasticity deforms very little when loaded. Modulus of elasticity is ' +
          'represented by the symbol E and is expressed in units of force per unit area.'
  },
  {
    id: 'glos_moment_of_inertia',
    title: 'Moment of inertia',
    text: `The moment of inertia is a measure of a member's resistance to bending and buckling . It is a functi` +
          'on only of the shape and dimensions of the cross-section. Moment of inertia is represented by the sy' +
          'mbol I and is expressed in units of length, raised to the 4th power.'
  },
  {
    id: 'glos_pier',
    title: 'Pier',
    text: 'A pier is a part of a bridge substructure that provides intermediate support for a multi-span bridge' +
          '.'
  },
  {
    id: 'glos_reinforced_concrete',
    title: 'Reinforced concrete',
    text: 'Reinforced concrete is concrete with steel reinforcing rods embedded inside it for added strength. C' +
          'oncrete is very strong in compression , but comparatively weak in tension . The reinforcing bars can' +
          ' substantially increase the ability of reinforced concrete to carry tension.'
  },
  {
    id: 'glos_resistance_factor',
    title: 'Resistance factor',
    text: 'A resistance factor is a dimensionless number used in the calculation of tensile strength and compre' +
          'ssive strength for structural members . The resistance factor provides a margin of safety for the de' +
          'sign. It accounts for uncertainty in material strength, member dimensions, and construction quality.' +
          ' A resistance factor is always less than or equal to 1.'
  },
  {
    id: 'glos_safe',
    title: 'Safe',
    text: 'A member is safe when the internal member force is less than the strength of the member, in both ten' +
          'sion and compression .'
  },
  {
    id: 'glos_session',
    title: 'Session',
    text: 'You initiate a new session anytime you start new design, load a sample design, or open an existing b' +
          'ridge design file . Within a given session, all of your design iterations are preserved. You can rev' +
          'ert to a previous design iteration at any time during the session by clicking the Go back button.'
  },
  {
    id: 'glos_simple_supports',
    title: 'Simple supports',
    text: 'Simple supports consist of a pin at one end of the span and a roller at the other end. The roller al' +
          'lows for lateral expansion and contraction of the bridge, due to loads and temperature changes. In t' +
          'he Bridge Designer, standard abutments use simple supports.'
  },
  {
    id: 'glos_site_cost',
    title: 'Site cost',
    text: 'In the Bridge Designer, the site cost includes the cost of the substructure (the abutments and piers' +
          ' that support the bridge) and the cost of the concrete deck . The site cost must be added to the tru' +
          'ss cost to determine the total project cost.'
  },
  {
    id: 'glos_slenderness',
    title: 'Slenderness ratio',
    text: 'The slenderness ratio is a number that describes the "thickness" of a member. Members that are long ' +
          'in comparison to their cross-sections have larger slenderness ratios than those that are shorter. Ve' +
          'ry slender members are more likely to buckle or to be damaged during handling. A slenderness check e' +
          'nsures that all members have slenderness ratios of no more than 300. Any overly slender member cause' +
          's the bridge to fail.'
  },
  {
    id: 'glos_slope',
    title: 'Slope',
    text: 'The slope of a roadway or embankment is a measure of its steepness, expressed as a ratio of vertical' +
          ' distance to horizontal distance. For example, a river bank with a slope of 2:1 rises 2 meters for e' +
          'very 1 meter of horizontal distance.'
  },
  {
    id: 'glos_snap_points',
    title: 'Snap points',
    text: 'A snap point is the intersection of two grid lines on the drawing grid . Joints can only be drawn at' +
          ' the snap points; thus, when you draw or move joints in your structural model , the mouse pointer au' +
          'tomatically "snaps" to the nearest snap point. The grid lines are actually not visible, but their lo' +
          'cations are indicated by marks on the vertical and horizontal rulers located on the left and bottom ' +
          'edges of the Drawing Board.'
  },
  {
    id: 'glos_span',
    title: 'Span',
    text: 'The span of a bridge is its length from support to support.'
  },
  {
    id: 'glos_standard_abutments',
    title: 'Standard abutments',
    text: 'In the Bridge Designer, standard abutments are substructure elements that use simple supports to hol' +
          'd up the bridge and transmit its weight to the soil below.'
  },
  {
    id: 'glos_structural_analysis',
    title: 'Structural analysis',
    text: 'A structural analysis is a mathematical analysis of a structural model , to determine all of the mem' +
          'bers forces resulting from a given set of loads . The Bridge Designer uses a structural analysis for' +
          'mulation called the Direct Stiffness Method.'
  },
  {
    id: 'glos_structural_model',
    title: 'Structural model',
    text: 'A structural model is a mathematical idealization of an actual structure. The model allows us to pre' +
          'dict how the actual structure will behave when it is loaded. A structural model of a truss has the f' +
          'ollowing idealized characteristics: It is composed of members , interconnected at joints . Each memb' +
          'er is connected to exactly two joints, one at each end. The joints are assumed to act like hinges; t' +
          'hat is, they hold the members together, but do not prevent the ends of the members from rotating wit' +
          'h respect to each other. The members only carry axial force--either compression or tension . They do' +
          ' not bend. Loads can be applied to the structure only at the joints. Supports can be placed only at ' +
          'the joints.'
  },
  {
    id: 'glos_substructure',
    title: 'Substructure',
    text: 'The substructure is the foundation of a bridge. It consists of the abutments and piers that support ' +
          'the bridge and transmit its weight to the earth below.'
  },
  {
    id: 'glos_supports',
    title: 'Supports',
    text: 'A support is a joint at which a structure is attached to its foundation. A truss bridge can have two' +
          ' different types of supports: (1) pinned supports, which restrain both horizontal and vertical movem' +
          'ent of the associated joint, and (2) roller supports, which restrain vertical movement but allow hor' +
          'izontal expansion of the structure.'
  },
  {
    id: 'glos_symmetrical',
    title: 'Symmetrical',
    text: 'The term "symmetrical" can apply to both a structure and its loading. In a symmetrical structure, th' +
          'e left-hand and right-hand sides of the structure are exact mirror imges of each other. In a symmetr' +
          'ical loading, the loads applied on either side of the bridge centerline are identical.'
  },
  {
    id: 'glos_template',
    title: 'Template',
    text: 'In the Bridge Designer, a template is a diagram depicting a standard truss configuration. If you loa' +
          'd a template, it is displayed on the Drawing Board in light grey dotted lines. The template will sho' +
          'w you where to locate joints and members to create a stable truss design.'
  },
  {
    id: 'glos_tension',
    title: 'Tension',
    text: 'Tension is an internal axial member force that tends to <<<lengthen>>> a member.'
  },
  {
    id: 'glos_through_truss',
    title: 'Through truss',
    text: 'A through truss is a truss with its deck located at the bottom chord. On a through truss, vehicles t' +
          'russ pass between the two main trusses as they cross the bridge.'
  },
  {
    id: 'glos_unsafe',
    title: 'Unsafe',
    text: 'A member is unsafe when the internal member force exceeds the strength of the member. A member is un' +
          'safe in tension if the maximum tension force exceeds the tensile strength. A member is unsafe in com' +
          'pression if the maximum compression force exceeds the compressive strength.'
  },
  {
    id: 'glos_verticals',
    title: 'Verticals',
    text: 'Verticals are truss members that are oriented vertically. Usually they connect the top and bottom ch' +
          'ords together.'
  },
  {
    id: 'glos_wearing_surface',
    title: 'Wearing surface',
    text: 'A wearing surface is a layer of pavement material--normally asphalt or concrete --placed on top of a' +
          ' bridge deck to protect the deck from being damaged by automobile traffic.'
  },
  {
    id: 'glos_yield_stress',
    title: 'Yield stress',
    text: 'The yield stress is the strength of a metal. It is the force per unit area at which the metal fails ' +
          'by yielding .'
  },
  {
    id: 'glos_yielding',
    title: 'Yielding',
    text: 'Yielding is one possible failure mode for a member made of metal. When a metallic material fails by ' +
          'yielding, it undergoes very large deformations (i.e., it stretches) without being able to carry any ' +
          'additional load.'
  },
  {
    id: 'glossary',
    title: 'Glossary',
    text: 'A AASHTO abutment anchorages arch abutments arch supports asphalt ASTM B bearing bridge design file ' +
          'buckling C cable anchorages chords client compression concrete connections cut D deck deck truss dia' +
          'gonals displacement drawing grid Dynamic Load Allowance F floor beams footing forces J joints K kilo' +
          'newton kN L load factors load test loads M mass density member force member numbers member propertie' +
          's member size members modulus of elasticity moment of inertia P pier R reinforced concrete resistanc' +
          'e factor S safe session simple supports site cost slope snap points span standard abutments structur' +
          'al analysis structural model substructure supports symmetrical T template tension through truss U un' +
          'safe V verticals W wearing surface Y yield stress yielding'
  },
  {
    id: 'hlp_aashto_h20x44',
    title: 'AASHTO H25 truck loading',
    text: 'The AASHTO H25 loading is a hypothetical cargo truck, similar to the one pictured here. The truck ha' +
          's two axles spaced approximately 4 meters apart. The truck has a total weight of 225 kilonewtons (kN' +
          '), with 44 kN applied at the front axle and 181 kN at the rear. When the AASHTO truck loading is use' +
          'd to design a bridge, the axle weights are generally increased by a factor called the dynamic load a' +
          'llowance , which accounts for the effects of the moving load. When a structural engineer designs an ' +
          'actual bridge, he or she must ensure that all members in the structure can safely carry the forces g' +
          'enerated when one AASHTO truck loading is applied to every traffic lane on the bridge deck . The tru' +
          'ck loading can be positioned anywhere along the length of the bridge. As indicated in the design spe' +
          'cifications , the Bridge Designer allows you to design a bridge for either of two highway loading co' +
          'nditions: Two lanes of highway traffic, represented by one H25 truck in each lane. A single 480 kN "' +
          'permit loading," centered laterally on the roadway. In the first load case, with two traffic lanes, ' +
          'each of the two main trusses must carry the weight of one lane. Thus the loading used in the Bridge ' +
          'Designer consists of one H25 truck, with a total weight of 225 kN. In the second case, with a single' +
          ' truck centered on the roadway, each of the two main trusses must carry one-half of the total truck ' +
          'weight. Thus the permit loading used in the Bridge Designer consists of 240 kN, with 120 kN applied ' +
          'at each axle location. In both cases, the dynamic load allowance is 1.33.'
  },
  {
    id: 'hlp_animation_controls',
    title: 'Animation controls palette',
    text: 'Use the tools on the animation controls palette to change some aspects of the load test animation : ' +
          'Click the play button to start or restart the animation. Click the pause button to temporarily halt ' +
          'the animation. Click the rewind button to reset the animation to its starting point, where no load i' +
          's applied to the bridge. Move the animation speed slider to change the speed of the truck. These var' +
          'y from 0.5 to 30km per hour. Press the drop button to reveal and hide additional animation controls.' +
          ' When the additional controls are visible, check and uncheck the boxes to display and hide of variou' +
          's animation features. Shadows controls whether the sun casts shadows within the simulated scene. Sky' +
          ' controls whether the sky is drawn using a realistic graphic that includes clouds, sun, and hills in' +
          ' the distance or a simple blue background. Terrain controls whether the ground and water around the ' +
          'bridge are drawn. Abutments controls whether the bridge abutments and road surfaces are drawn. Color' +
          's controls whether member forces are depicted with colors. If the box is checked, compression is rep' +
          'resented by red and tension by blue as the load moves across the bridge deck. Otherwise a flat gray ' +
          'is used. Erosion controls whether the terrain color is adjusted to depict soil erosion on steep slop' +
          'es. Note that some computers may not properly draw eroded terrain due to bugs in graphics card drive' +
          'rs. If the terrain is strangely colored or disappears when erosion is checked, just keep this contro' +
          'l in the unchecked state. Exaggeration controls whether member deflections are exaggerated to make t' +
          'hem more visible. When unchecked, the animation is realistic. When checked, changes in the shape of ' +
          'the truss under load are multiplied by 20 in order to make them more visible. Truck controls whether' +
          ' the cartoon of the truck loading is shown or hidden. Some of these options are missing or modified ' +
          'if old style graphics have been selected. Notes and tips Use the animation view controls to walk und' +
          'er, over and through the bridge site. The animation controls palette is normally displayed whenever ' +
          'you load test your design . The palette is automatically hidden when you return to the drawing board' +
          '. If you manually close the controls, you can make it visible again with the view animation controls' +
          ' menu item. When you initiate the load test , the play button is automatically depressed. When you p' +
          'ause, you must use the play button to restart. The smoothness of the animation depends on the speed ' +
          `of your computer's processor and graphics system. If the motion looks too "jerky," try turning off s` +
          'ome of the animation features. Turning off shadows is likely to have the greatest effect.'
  },
  {
    id: 'hlp_animation_view_controls',
    title: 'Animation view controls',
    text: 'The animation view controls move and rotate the viewpoint of the load test animation within the scen' +
          'e, creating the impression of flying under, over, and through the bridge. They are normally shown in' +
          ' faded colors on the left side of the animation screen as shown here. When you pass the mouse over a' +
          'ny of the controls, it will brighten to full color. Click and drag the walk control to move forward ' +
          'and turn left or right in the scene as though you are walking. Dragging upward moves forward. Draggi' +
          'ng downward moves to the rear. Click and drag the slide control to move laterally in any direction a' +
          's though your are stepping sideways or moving up or down in an elevator within the scene. Click and ' +
          'drag the head tilt control to change the view as though tilting your head up, down, left, or right w' +
          'hile observing the scene. For example, walk under a bridge span and tilt up to observe the structure' +
          ' beneath the deck. Click the home control to move back to a position where the whole bridge is visib' +
          'le. Click and drag the truck view control to see what the truck driver sees as she drives over the b' +
          'ridge. Drag the mouse left, right, up, and down to see all around.'
  },
  {
    id: 'hlp_auto_correct_errors',
    title: 'Auto-correct errors check box',
    text: 'Checking the menu entry at tools , auto-correct errors causes BD to attempt repairs of common minor ' +
          `errors. It does this automatically just before each load test . Notes and tips It's usually best to ` +
          `enable the auto-correction feature because it can't do any harm. Any undesired changes that it makes` +
          ' can be removed with undo after analysis is complete.'
  },
  {
    id: 'hlp_bars_or_tubes',
    title: 'Solid bar or hollow tube?',
    text: 'As you optimize the member properties in your design, one of the most important decisions you will m' +
          'ake is the selection of a cross-section type - solid bar or hollow tube - for each member in your st' +
          'ructural model . In making this decision, you should consider the effect of the different cross-sect' +
          'ions on member strength in both tension and compression . Compression members: For a given material,' +
          ' hollow tubes are somewhat more expensive than solid bars, in dollars per kilogram. Compared with a ' +
          'solid bar of the same mass , though, a hollow tube provides a much larger moment of inertia . Thus a' +
          ' hollow tube resists buckling more efficiently than a solid bar. Its compressive strength is usually' +
          ' substantially greater. For compression members , then, the increased compressive strength of a tube' +
          ' often outweighs the increased cost per kilogram. It is usually most economical to use hollow tubes ' +
          'for members that carry load primarily in compression. Tension members: For a given material, solid b' +
          'ars are somewhat less expensive than hollow tubes, in dollars per kilogram. However, tensile strengt' +
          'h depends only on the cross-sectional area of the member, not the moment of inertia. A solid bar and' +
          ' a hollow tube of the same mass also have the same cross-sectional area. Therefore, both have the sa' +
          'me tensile strength. Since the solid bar costs less, and the hollow tube offers no strength advantag' +
          'e in tension, solid bars are usually the better choice for tension members. It is usually most econo' +
          'mical to use solid bars for members that carry load primarily in tension.'
  },
  {
    id: 'hlp_bridge_design_window',
    title: 'Bridge design window',
    text: 'The bridge design window is the graphical environment where you create, test, optimize, and record y' +
          'our bridge design. The diagram below shows the major functional components that make up the Bridge d' +
          'esign window. To learn more about each component, click the corresponding area on the diagram. Notes' +
          ` and tips It's best to keep the bridge design window maximized while working on your design. Reducin` +
          'g the window size makes drawing and editing your structural model more difficult.'
  },
  {
    id: 'hlp_change_member_properties',
    title: 'Change the properties of a member',
    text: 'To change the properties of a member in your structural model: Click the select tool on the design t' +
          'ools palette . Select the member you want to modify, either by clicking on the member itself or by c' +
          'licking its entry in the member list. The member will turn light blue when selected. Click the drop-' +
          'down button on the member properties list for the property you want to change - material , cross-sec' +
          'tion , or member size . Select a material, cross-section, or member size from the respective list. T' +
          'he new property will be assigned to the selected member. Notes and tips To change the properties of ' +
          'several members simultaneously, use multiple selection then choose a new material, cross-section, or' +
          ' member size from the appropriate member properties list. To increase or decrease the size of all se' +
          'lected members to the next larger or smaller one, select the members you want to modify, then click ' +
          'the increase member size button or decrease member size button . If you use multiple selection with ' +
          `either button, the selected members won't necessarily all end up with the same size. They'll increas` +
          'e or decrease independently. If you want to change the properties of all members in your structural ' +
          'model , click the select all button then choose a new material, cross-section, or member size. When ' +
          'you change the properties of a member, the appearance of that member will change on the drawing boar' +
          'd. Changing the material will cause the color of the displayed member to change; changing the size w' +
          'ill cause the width of the member to change accordingly; changing the cross-section from a solid bar' +
          ' to a hollow tube will cause the displayed member to change from a single line to a double line, and' +
          ' vice versa.'
  },
  {
    id: 'hlp_choose_optimum',
    title: 'Choose the optimum design',
    text: 'How to design a bridge Go back one step Go forward one step In the Bridge Designer , an optimum desi' +
          'gn is one that costs the least. After you have considered as many different alternative site and tru' +
          'ss configurations as possible, choose the one with the lowest total cost as your final design. Notes' +
          ' and tips In the design of an actual bridge, there are many other criteria that would be taken into ' +
          'account while selecting the most desirable alternative. These include aesthetics, ease of constructi' +
          'on, ease of maintenance, local availability of materials, and environmental impact.'
  },
  {
    id: 'hlp_component_parts',
    title: 'Component parts of a truss bridge',
    text: 'The major component parts of a typical truss bridge are: chords (top and bottom) verticals (also cal' +
          'led vertical members ) diagonals (also called diagonal members) floor beams deck pinned support (als' +
          'o called a fixed bearing ) roller support (also called an expansion bearing) abutments (or piers ) T' +
          'hese component parts are illustrated below: 3-dimensional view Elevation (side) view Notes and tips ' +
          'A number of standard truss configurations are commonly used in bridge structures. These are defined ' +
          'primarily by the geometry of their vertical and diagonal members.'
  },
  {
    id: 'hlp_compressive_strength',
    title: 'Compressive strength',
    text: 'The compressive strength of a member is the internal force that causes it to become unsafe in compre' +
          'ssion . If the actual member force exceeds the compressive strength, then the member might fail. The' +
          ' compressive strength calculations performed by the Bridge Designer are based on the buckling failur' +
          'e mode. Compressive strength is represented by the symbol ϕP n and is measured in units of force, su' +
          'ch as kilonewtons , abbreviated kN. Compressive strength can be calculated using the following equat' +
          'ions: If λ ≤ 2.25, then ϕP n = ϕ(0.66 λ )F y A If λ > 2.25, then ϕP n = ϕ(0.88 F y A) ⁄ λ where λ = ' +
          '(F y AL 2 ) ⁄ (π 2 EI) is a dimensionless parameter that differentiates between the inelastic ( λ ≤ ' +
          '2.25) and elastic ( λ > 2.25) buckling failure modes. and ϕ = 0.90 is the resistance factor for a me' +
          'mber in compression F y is the yield stress A is the cross-sectional area of the member π is 3.14159' +
          '... E is the modulus of elasticity of the material I is the moment of inertia of the member L is the' +
          ' length of the member Notes and tips These equations are taken from the 1994 AASHTO LRFD Bridge Desi' +
          'gn Specifications . To see a graph of compressive strength, as a function of member length, see the ' +
          'member details tab . To obtain the numerical values of F y and E for a given material and A and I fo' +
          'r a given cross-section and member size , click the member details tab . The Bridge Designer calcula' +
          'tes the compressive strength of each member in your structural model during the load test. The compr' +
          'essive strength of a member is always less than its tensile strength . If the member is relatively l' +
          'ong and slender, the difference can be quite substantial. The number 0.88 in the equation above acco' +
          'unts for the fact that actual structural members are never perfectly straight. Because of their slig' +
          'ht crookedness, actual structural members buckle at an internal force that is (on average) about 12%' +
          ' lower than theory predicts.'
  },
  {
    id: 'hlp_cost',
    title: 'Cost of the design',
    text: 'The Bridge Designer automatically calculates the cost of your bridge design as you create it. This c' +
          'ost is continuously updated and displayed on the status toolbar . The cost calculated by Bridge Desi' +
          'gner does not accurately represent the total cost of an actual bridge project. Rather, it is intende' +
          'd to give a general appreciation for competing factors that influence the cost of a typical engineer' +
          'ing project: a learning tool. The total cost of your bridge design consists of two major components ' +
          '- site cost and truss cost. The site cost, in turn, is the sum of three components: excavation cost ' +
          'deck cost support cost The truss cost also includes three components: material cost connection cost ' +
          'product cost All of these cost components are described below. The specific numerical cost factors f' +
          'or each are listed in the design specifications . Site Cost The site cost consists of all costs asso' +
          'ciated with your selection of the site configuration - the deck height, span length, and support con' +
          'figuration of your bridge. Excavation Cost When you select the deck height, you determine the amount' +
          ' of soil that must be excavated to achieve the correct highway elevation. The lower the deck, the mo' +
          're excavation is required. As in real-world construction, excavation is priced by the cubic yard or ' +
          'cubic meter. The Bridge Designer determines the required volume of soil excavation based on the sele' +
          'cted deck elevation. Deck Cost Your selection of the deck height also determines the overall span le' +
          'ngth of the bridge. A higher deck results in a longer span, which increases both the truss cost and ' +
          'the cost of the reinforced concrete deck. In the Bridge Designer , you can also select the material ' +
          'that the deck is made of - either medium-strength or high-strength concrete. Medium-strength concret' +
          'e costs less than high-strength concrete, but its lower strength requires the deck to be thicker. Th' +
          'is thicker deck weighs more than a thinner high-strength concrete deck and thus will increase the lo' +
          'ading on the truss. Increased loading will cause the truss cost to increase. The result: a cheaper d' +
          'eck tends to require a more expensive truss and vice versa. In either case, the cost of the deck is ' +
          'specified as a lump-sum cost for each 4-meter deck panel. Support Cost When you select the type of a' +
          'butments , piers , and cable anchorages used in your bridge, the Bridge Designer determines the cost' +
          's associated with constructing these supports. Each support configuration has its own unique cost. F' +
          'or a given type of abutment (standard or arch), the cost tends to increase with span length, because' +
          ' longer spans weigh more than shorter spans and thus transmit greater loads to the supports. In gene' +
          'ral, standard abutments cost less than arch abutments for a given span length. The costs of arch abu' +
          'tments and piers also vary significantly with height. Higher abutments and piers use more material t' +
          'han shorter ones, so they cost more. Cable anchorages have a single lump-sum cost. Truss Cost The tr' +
          'uss cost consists of all costs associated with the structural steel members and connections that mak' +
          'e up the two main trusses - the principal load-carrying elements of the bridge. Material cost Struct' +
          'ural steel is normally priced by weight (or mass); e.g., dollars per pound or dollars per kilogram. ' +
          'Thus the cost of a structure depends, in part, on the total weight of material used to build it. The' +
          ' Bridge Designer calculates the material cost by determining the total mass of the three available m' +
          'aterials - carbon steel, high-strength steel, and quenched and tempered steel--in your structural mo' +
          'del multiplying the mass of each material type by the corresponding unit cost, in dollars per kilogr' +
          'am adding these together to get the total material cost. As noted in the design specifications , eac' +
          'h of the three different types of steel has a different unit cost. Carbon steel is least expensive; ' +
          'quenched and tempered steel is most expensive. For a given material, hollow tubes are more expensive' +
          ' (per kilogram) than solid bars. Connection cost In real structures, the cost of fabricating and bui' +
          'lding the connections that join the members together can be very significant. Thus the Bridge Design' +
          'er includes a cost per joint as part of the total cost of the structure. Because the actual three-di' +
          'mensional bridge has two main trusses, the number of connections used as the basis for this calculat' +
          'ion is double the number of joints in your two-dimensional structural model. Product cost In structu' +
          'ral design and construction, the most economical design is often not the one that simply minimizes t' +
          'he material cost. Often the total cost of the structure can be reduced by standardizing materials an' +
          'd member sizes. If all the members in a structure are different materials and sizes, then the cost o' +
          'f ordering, fabricating, and constructing those members will be relatively high. If many members are' +
          ' the same, fabrication and construction costs will be relatively lower. For this reason, the Bridge ' +
          'Designer includes a cost per product as part of the total cost of the truss. A product is defined as' +
          ' any unique combination of material, cross-section, and member size in your structural model. Cost C' +
          'alculations To see the cost factors (cost per kilogram, cost per joint, cost per product, and site c' +
          'ost) and the actual cost calculations for your current design, click the report cost calculations bu' +
          'tton . The site design wizard also displays detailed calculations for each component of the site cos' +
          't. Minimizing Total Cost As you attempt to minimize the total cost of your bridge design, you will f' +
          'ind that you can never minimize the site cost, material cost, connection cost, and product cost simu' +
          'ltaneously. Minimizing the total cost is always a compromise among these four competing factors. To ' +
          'minimize the site cost , you would simply select the site configuration that costs the least. But th' +
          'e least expensive site configuration requires a simply supported truss spanning a full 44 meters. Th' +
          'is configuration will require a relatively heavy truss - one with a high material cost. To minimize ' +
          'the material cost, you must make each member as light as it can possibly be without failing. For mos' +
          't truss configurations, achieving this condition requires the use of both solid bars and hollow tube' +
          's in a wide variety of different sizes. Minimizing the material cost requires you to use a lot of di' +
          'fferent products and, as a result, your product cost will be quite high. To minimize the connection ' +
          'cost , you must use the smallest possible number of joints. But if you minimize the number of joints' +
          ', you will inevitably have a few very long members in your structural model. If a long member is sub' +
          'jected to compressive loading, it will require a very large member size to keep it from failing. (As' +
          ' a member gets longer, its compressive strength decreases significantly.) Thus minimizing the connec' +
          'tion cost usually results in a high material cost . To minimize the product cost , you would need to' +
          ' use a single material, cross-section, and size for every member in your structural model. But your ' +
          'single member size would have to be large enough to ensure that the most heavily loaded member in th' +
          'e structure does not fail. As a result, many of the other members would be much stronger - and there' +
          'fore much heavier - than they really need to be, and your material cost would be extremely high. Cle' +
          'arly there are tradeoffs among site cost, material cost, connection cost, and product cost. Minimizi' +
          'ng one always increases one or more of the others. Your task as the designer is to find the best com' +
          'promise.'
  },
  {
    id: 'hlp_crossxsection',
    title: 'Cross-section',
    text: 'A cross-section is the shape formed by cutting through a member perpendicular to its axis. The cross' +
          '-section of the solid bar below is a square measuring w on each side. The cross-section of the hollo' +
          'w tube below is an open square measuring w on each side, with a wall thickness of t . The cross-sect' +
          'ional area of a member is the surface area of the cross-section. In each picture above, this is the ' +
          'light blue shaded region.'
  },
  {
    id: 'hlp_deck_truss',
    title: 'Cross-section',
    text: 'Deck truss A deck truss is one with its deck located at the level of the top chord. Vehicles crossin' +
          'g a deck truss bridge are supported above its trusses.'
  },
  {
    id: 'hlp_decrease_member',
    title: 'Decrease member size button',
    text: 'Click the decrease member size button to decrease the size of currently selected member(s) to the ne' +
          'xt smaller. Notes and tips The decrease member size button is located on the member properties toolb' +
          'ar. If more than one member is selected, clicking this button will decrease the size of all selected' +
          ' members , even if they are different sizes. For example, if a 50mm member, a 90mm member, and a 120' +
          'mm member are all selected, clicking the button will change these to 45mm, 80mm, and 110mm, respecti' +
          'vely. When you use the decrease member size button, the member size list is updated to reflect the c' +
          'hange. When you use the decrease member size button, the other two member properties lists - materia' +
          'l and cross-section type - do not change.'
  },
  {
    id: 'hlp_delete',
    title: 'Delete button',
    text: 'Click the delete button to delete the currently selected joint or to delete the currently selected m' +
          'ember(s). Notes and tips The delete button is located on the main toolbar. It can also be accessed f' +
          'rom the edit menu. You can use the delete key on your keyboard to perform exactly the same function ' +
          'as the delete button. You can also use the eraser tool to delete joints and members .'
  },
  {
    id: 'hlp_delete_joint',
    title: 'Delete a joint',
    text: 'To delete a joint from your structural model: Click the select tool on the design tools palette. Cli' +
          'ck on the joint you want to delete. It will turn light blue to indicate it has been selected. Click ' +
          'on the delete button . Notes and tips You must be working in the drawing board to delete a joint. Th' +
          'e delete key on your keyboard performs the same function as the delete button on the toolbar. You ca' +
          'n only delete one joint at a time. Multiple selection of joints is not allowed. When you delete a jo' +
          'int, all members attached to that joint are also deleted. You cannot delete the joints that were cre' +
          'ated automatically by the Bridge Designer when you started the design. You can also delete a joint f' +
          'rom your structural model by erasing it. If you accidentally delete a joint, click the undo button t' +
          'o restore it.'
  },
  {
    id: 'hlp_delete_member',
    title: 'Delete a member',
    text: 'To delete a member from your structural model: Click the Select tool on the Design Tools palette. Se' +
          'lect the member you want to delete, either by clicking on the member itself or by clicking its entry' +
          ' in the Member List. The member will turn light blue to indicate that it has been selected. Click on' +
          ' the Delete button to delete the selected member. Notes and tips You must be in the Drawing Board Mo' +
          'de to delete a member. If you want to delete more than one member at a time, use multiple selection,' +
          ' then click the Delete button. The Delete key on your keyboard performs the same function as the Del' +
          'ete button on the toolbar. When you delete a member, all members with higher member numbers are re-n' +
          'umbered to fill the gap. You can also remove a member from your structural model by erasing it. If y' +
          'ou accidentally delete a member, click the Undo button to restore it.'
  },
  {
    id: 'hlp_design_iteration',
    title: 'What is a design iteration?',
    text: 'Anytime you make one or more changes to your structural model , then run the load test , you have pe' +
          'rformed one design iteration . The Bridge Designer saves all design iterations created during the cu' +
          'rrent session and provides the capability for you to revert to previous iterations at any time durin' +
          'g the session. Notes and tips To revert to a previous design iteration, click the Go back button or ' +
          'the Go To Iteration button. The current design iteration number is always displayed on the Main Tool' +
          'bar . The number is incremented at the start of each new iteration--whenever you make the first chan' +
          'ge to your structural model after a load test. Design iteration numbers are never duplicated, and th' +
          'e design iterations themselves are never overwritten, even when you revert to a previous iteration. ' +
          'For example, suppose you are working on design iteration 10 , then decide to go back to to iteration' +
          ' 6. The design iteration number displayed on the Main Toolbar will change from 10 to 6 accordingly. ' +
          'But as soon as you make any change to the structural model, the design iteration number will update ' +
          'to 11, since you now have initiated a new iteration. In this way, all of your previous iterations--6' +
          ', 7, 8, 9, and 10--are preserved for future use. You can see how design iterations are related using' +
          ' the Tree View tab. Reverting to a previous design iteration can be particularly useful when you are' +
          ' optimizing your design. The optimization process is never linear; it is always marked by dead ends ' +
          'and unexpected outcomes. Some of your attempts at optimization will be successful and others will no' +
          't. After an unsuccessful attempt, you can simply revert to a previous successful design iteration an' +
          'd try again. Previous design iterations are only preserved until the end of the current session. Whe' +
          'n you start a new design or exit the Bridge Designer , previous iterations are deleted. Thus the Des' +
          'ign Iteration Browser can only display iterations created during the current session.'
  },
  {
    id: 'hlp_design_specifications',
    title: 'Design specifications',
    text: 'All of the specifications listed below are built into the Bridge Designer . If you follow the design' +
          ' process , Bridge Designer will ensure that you satisfy the specifications. They are listed here onl' +
          'y so that you can better understand the sorts of requirements and constraints that engineers conside' +
          `r when they design real bridges. The problem You're a civil engineer working for the state departmen` +
          't of transportation. You have been assigned responsibility for the design of a truss bridge to carry' +
          ' a two-lane highway across the river valley shown below. Design objective Satisfy all of the specifi' +
          'cations listed below while keeping the total cost of the project as low as possible. Bridge configur' +
          'ation The bridge may cross the valley at any elevation from the high water level up to 24 meters abo' +
          've the high water level. If the elevation of the bridge deck is below 24 meters, excavation of the r' +
          'iver banks will be required to achieve the correct highway elevation. The amount of excavation requi' +
          'red at each deck elevation is determined automatically by the Bridge Designer . To provide clearance' +
          ' for overhead power lines as shown above, the highest point on the bridge may not exceed an elevatio' +
          'n 32.5 meters above the high water level (8.5 meters above the top of the river banks). The bridge s' +
          'ubstructure may consist of either standard abutments (simple supports) or arch abutments (arch suppo' +
          'rts). If necessary, the bridge may also use one intermediate pier located near the center of the val' +
          'ley. If necessary, the bridge may also use cable anchorages , located 8 meters behind one or both ab' +
          'utments. Each main truss can have no more than 100 joints and no more than 200 members . The bridge ' +
          'will have a flat, reinforced concrete deck. Two types of concrete are available: Medium-strength con' +
          'crete requires a deck thickness of 23 centimeters (0.23 meter). High-strength concrete requires a de' +
          'ck thickness of 15 centimeters (0.15 meter). In either case, the deck will be supported by transvers' +
          'e floor beams spaced at 4 meter intervals. (See component parts of a truss bridge for more informati' +
          'on about these terms.) To accommodate the floor beams, your structural model must have a row of deck' +
          ' support joints spaced 4 meters apart at deck level. These joints are created automatically when you' +
          ' begin a new design. The bridge deck will be 10 meters wide, allowing it to accommodate two lanes of' +
          ' traffic. Member properties Materials . Each member of the truss will be made of carbon steel, high-' +
          'strength low-alloy steel, or quenched and tempered steel. Cross-sections . The members of the truss ' +
          'can be either solid bars or hollow tubes. Both types of cross-sections are square. Member Size . Bot' +
          'h cross-sections are available in a variety of standard sizes. Loads The bridge must be capable of s' +
          'afely carrying the following loads: Weight of the reinforced concrete deck. Weight of a 5-cm thick a' +
          'sphalt wearing surface , which might be applied at some time in the future. Weight of the steel floo' +
          'r beams and supplemental bracing members. These apply a 12.0 kN load at each deck support joint. Wei' +
          'ght of the main trusses. The weight of either of two possible truck loadings: One standard H25 truck' +
          ' loading per lane, including appropriate allowance for the dynamic effects of the moving load. (Sinc' +
          'e the bridge carries two lanes of traffic, each main truss must safely carry one H25 vehicle, placed' +
          ' anywhere along the length of the deck.) A single 480 kN permit Loading, including an allowance for ' +
          'the dynamic effects of the moving load. Since the permit loading is assumed to be centered laterally' +
          ', each main truss must safely carry one-half of the total vehicle weight, placed anywhere along the ' +
          'length of the deck. Structural safety The bridge will comply with the structural safety provisions o' +
          'f the 1994 LRFD AASHTO Bridge Design Specification. LRFD refers to "Load and Resistance Factor Desig' +
          'n." It includes: Material densities Load combinations Tensile strength of members Compressive streng' +
          'th of members Cost The cost of the design will be calculated using the following factors: Material c' +
          'ost: Carbon steel bars - $4.50 per kilogram Carbon steel tubes - $6.30 per kilogram High-strength st' +
          'eel bars - $5.00 per kilogram High-strength steel tubes - $7.00 per kilogram Quenched and tempered s' +
          'teel bars - $5.55 per kilogram Quenched and tempered steel tubes - $7.75 per kilogram Connection cos' +
          't: $500.00 per joint Product cost: $1000.00 per product Site Cost: Reinforced concrete deck (medium ' +
          'strength) - $5,150 per 4-meter panel Reinforced concrete deck (high strength) - $5,300 per 4-meter p' +
          'anel Excavation - $1.00 per cubic meter. See the site design wizard for excavation volume. Supports ' +
          '(abutments and pier) - Cost varies. See the site design wizard for specific values. Cable anchorages' +
          ' - $6,000 per anchorage Notes and tips The Bridge Designer ensures that your design satisfies all of' +
          ' the design specifications listed above. The drawing board is automatically set up so that your brid' +
          'ge has the correct span length, height, and supports. Bridge Designer automatically calculates the l' +
          'oads and resulting member forces . When you run the load test , it performs the AASHTO structural sa' +
          'fety checks. If any of the members in your structural model are not strong enough, it tells you whic' +
          'h ones need it be strengthened. It also calculates the cost of your design. The AASHTO safety standa' +
          `rds have been simplified considerably in the Bridge Designer . That's one important reason why the s` +
          'oftware is for educational use only . For more information, see what is not realistic about BD? .'
  },
  {
    id: 'hlp_design_tools',
    title: 'Design tools palette',
    text: 'The design tools palette is a free-floating toolbar that can be positioned anywhere in the bridge de' +
          'sign window . It contains the following tools for creating and modifying your structural model: Join' +
          't tool Member tool Select tool Eraser tool Notes and tips To move the design tools palette to a new ' +
          'location, click and drag the title bar of the palette.'
  },
  {
    id: 'hlp_draw_joint',
    title: 'Draw joints',
    text: 'How to design a bridge Go back one step Go forward one step To create a structural model , you must ' +
          'first draw the joints . These are the connections where the structural members will be joined togeth' +
          'er. To draw a joint: Select the joint tool from the design tools palette . Position the mouse pointe' +
          'r at the location on the drawing board where you want to add a joint. Click the left mouse button to' +
          ' create the new joint. Notes and tips To draw a joint, you must be in the drawing board mode . Joint' +
          's can only be placed on the snap points of the drawing board. Joints cannot be placed outside the ma' +
          'ximum and minimum elevation restrictions noted in the design specifications. Two joints cannot be pl' +
          'aced at the same location. If you accidentally place a joint in the wrong location, you can click th' +
          'e undo button to remove it. You can also delete a joint , or you can move a joint to a new location.' +
          ' When you start a new design, a series of joints will be created automatically by the project setup ' +
          `wizard . These joints support the deck. They can't be moved or deleted. Movable joints have a black ` +
          'outline and a light grey center; immovable joints have a grey outline and a white center. The joints' +
          ` you create cannot be attached to the abutments or piers . In other words, you can't create any addi` +
          'tional supports. The only supports permitted are those created automatically by the project setup wi' +
          'zard . For site configurations with a high pier , joints cannot be drawn on the pier. Your structura' +
          'l model is limited to 50 joints.'
  },
  {
    id: 'hlp_draw_member',
    title: 'Draw members',
    text: 'How to design a bridge Go back one step Go forward one step Once you have drawn the joints that will' +
          ' connect your truss, you can draw the members that make up the structure itself. Members must be dra' +
          'wn from joint to joint. To draw a member: Select the member tool from the design tools palette. Posi' +
          `tion the mouse pointer over a joint. It will be highlighted to show it's ready to be connected. Clic` +
          'k the left mouse button, and hold it down. Drag the mouse pointer to another joint, and release the ' +
          'button. A new member will be created from the first joint to the second. Notes and tips To draw a me' +
          'mber, you must be in the drawing board mode . When you create a new member, the member properties cu' +
          'rrently displayed in the member properties lists are automatically assigned to the new member. These' +
          ' can be changed later. See change the properties of a member for more information. When you create n' +
          'ew members, their member numbers are assigned automatically. To display the member numbers, click th' +
          'e view member numbers button . Two members cannot be drawn between the same pair of joints. If you a' +
          'ttempt to draw a member that crosses over one or more joints between its ends, two or more members w' +
          `ill automatically be created. They'll all have the same properties. If you accidentally draw a membe` +
          'r in the wrong location, you can click the undo button to remove it, or you can delete the member. F' +
          'or site configurations with a high pier , members cannot be drawn through the intermediate pier. You' +
          'r structural model can have no more than 120 members.'
  },
  {
    id: 'hlp_drawing_board',
    title: 'Drawing board',
    text: 'The drawing board is the portion of the bridge design window where you create a structural model by ' +
          'drawing joints and members with your mouse. Using the drawing board, you can also edit the structura' +
          'l model by moving, adding, or deleting joints changing member properties adding and deleting members' +
          '. Notes and tips Use the drawing board button to return to the drawing board after a load test . The' +
          ' bridge abutments , floor beams , concrete deck , asphalt road surface, and high-water level are dis' +
          'played on the drawing board at all times. (See component parts of a truss bridge for more informatio' +
          `n about these terms.) Their size and position are based on the site configuration you've selected. T` +
          `he drawing board is covered by a drawing grid . (You can't see it, but it's there.) When you draw jo` +
          'ints to create your structural model, your mouse "snaps" to the grid line intersections, which are c' +
          'alled snap points . Joints can only be drawn at the snap points. The drawing grid can be set to low,' +
          ` medium, or high resolution. Use the grid resolution buttons to switch among the three. It's often e` +
          'asiest to create your structural model using the low-resolution grid, then switch to the medium- and' +
          ' high-resolution settings for editing. Horizontal and vertical rulers are displayed on the left and ' +
          'bottom edges of the drawing board to help you accurately position joints in your structural model. S' +
          'ymmetry guides can be displayed on the drawing board to help you position joints such that your stru' +
          'ctural model is symmetrical . A title block is displayed in the lower right-hand corner of the drawi' +
          'ng board. The title block shows the name of the bridge design project, the name of the designer, and' +
          ' a project identification name or number. The designer and project names can be changed at any time.' +
          ' When you start a new design , you may chose to display a truss template on the drawing board to hel' +
          'p you easily design a stable structural model.'
  },
  {
    id: 'hlp_drawing_board_button',
    title: 'Drawing board button',
    text: 'Click the drawing board button to return to drawing board mode after a load test. Notes and tips The' +
          ' drawing board button is located on the main toolbar . It can also be accessed from the test menu . ' +
          'The drawing board button and load test button work as a pair. Only one can be pressed at a time.'
  },
  {
    id: 'hlp_erase',
    title: 'Erase a joint or member',
    text: 'To erase a joint or member from your structural model: Click the eraser tool on the design tools pal' +
          'ette. Click on the joint or member you want to erase. Notes and tips You must be in the drawing boar' +
          'd mode to erase a joint or member. You can only erase one joint or member at a time. When you erase ' +
          'a joint, all members attached to that joint are also erased. You cannot erase the joints that were c' +
          'reated automatically by the Bridge Designer when you started a new design. When you erase a member, ' +
          'all members with higher member numbers are re-numbered to fill the gap. You can also delete a joint ' +
          'or delete a member to remove them from the structural model . If you accidentally erase a joint or m' +
          'ember, click the Undo button to restore it.'
  },
  {
    id: 'hlp_erase_tool',
    title: 'Eraser tool',
    text: 'Use the eraser tool to erase a joint or member directly, without having to select it first. Notes an' +
          `d tips The Eraser tool is located on the design tools palette. It's also available in the tools menu` +
          ' . When the eraser tool is in use, the mouse pointer appears as a pencil with a cross showing the cu' +
          'rsor location . When you move the eraser tool over the drawing board , joints and members are highli' +
          'ghted to indicate the item that will be erased by left button click.'
  },
  {
    id: 'hlp_find_opt_substructure',
    title: 'Find the optimum site configuration and load case',
    text: 'How to design a bridge Go back one step Go forward one step At this point in the design process, you' +
          ' have optimized your design for one particular site configuration and load case: one particular comb' +
          'ination of deck height, span length, support configuration, deck material, and truck loading. But, y' +
          `ou won't know if your design is truly optimal until you have considered other site configurations an` +
          'd load cases. The Bridge Designer allows for 98 possible site configurations, consisting of various ' +
          'combinations of deck elevation, support type, and support height. There are also four possible load ' +
          'cases consisting of various combinations of deck material and truck loading. The total cost of the b' +
          'ridge equals the site cost plus the truss cost. Each site configuration supports the bridge in a dif' +
          'ferent way. Thus, each has a different site cost. Each load case has a different effect on the steel' +
          ' truss. Thus, each is likely to result in a different truss cost. Even though the site cost makes up' +
          ` a major portion of the bridge's total cost, picking the configuration with the lowest site cost wil` +
          'l not necessarily result in the lowest total cost. Site configurations that have a low site cost ten' +
          'd to have relatively high truss costs and vice versa. A site configuration with a high deck elevatio' +
          'n will generally have a relatively low site cost because it requires little or no excavation. Yet, a' +
          ' configuration with a high deck elevation also has a greater span length. Longer spans require large' +
          'r, heavier trusses, which leads to higher truss costs. Arch abutments cost more than standard abutme' +
          'nts . Tall arch abutments cost more than short ones. Thus, site configurations that use arches tend ' +
          'to have higher site cost. But, the V-shape of the river valley allows arch abutments to reduce the s' +
          'pan length for a given deck height. The taller the abutment , the shorter the span. Arch abutments a' +
          'lso provide more lateral restraint than standard abutments. Both of these factors tend to lower the ' +
          'truss cost for arches. Building a pier in the middle of a river can be quite expensive. Thus, config' +
          'urations with piers have significantly higher site costs than those without. But. the pier also divi' +
          'des one long span into two short ones. Two short trusses are usually much less expensive than a sing' +
          'le long one. Cable anchorages are also expensive, but they provide for additional support and thus c' +
          'an reduce the truss cost significantly. An example is the cable supports of a cable-stayed bridge. T' +
          'he choice of deck material affects both the site cost and the loads applied during the load test . M' +
          'edium-strength concrete is less expensive than high-strength concrete, but it results in a thicker d' +
          'eck, which is heavier. High-strength concrete is more expensive but results in a thinner deck, which' +
          ' is lighter. Thus the less expensive deck material tends to result in a higher truss cost, while the' +
          ' more expensive deck material results in a lower truss cost. Your choice of truck loading has no eff' +
          'ect on the site cost but will have a significant effect on the truss cost. From all the above, the l' +
          'esson to be learned is that engineering design always involves tradeoffs . The tradeoff between the ' +
          'cost of a structure and the cost of its supporting substructure is a critically important aspect of ' +
          'most real-world bridge designs. So, which site configuration and load case will result in the lowest' +
          ' total cost? The only way you can answer this question is by trial and error combined with careful l' +
          'ogical reasoning. To find the optimum substructure configuration: Click the new design button . When' +
          ' the project setup wizard is displayed, select one of the site configurations or load cases you have' +
          `n't tried yet. It is best to change only one variable at a time, so you can draw valid conclusions a` +
          'bout the effect of the change. For example, suppose your first design was a single span with standar' +
          'd abutments and a deck height of 24 meters. For your second design, you might try an arch, but leave' +
          ' the deck height at 24 meters. Then the cost difference between the two trials can be directly attri' +
          'buted to the different support type. If you change the support type and the deck height simultaneous' +
          `ly, you won't know how each of these factors affects the cost. Repeat the previous eight steps of th` +
          'e design process for the new site configuration or load case. Decide on a truss configuration, draw ' +
          'joints , draw members , then load test the design, strengthen any unsafe members, optimize the membe' +
          'r properties , optimize the shape of the truss, and optimize the truss configuration. Now compare th' +
          'e results of the two trials. Draw a logical conclusion about the one variable you changed on the sec' +
          'ond trial. For a particular deck height, did standard abutments or arch abutments result in a lower ' +
          'cost? How large was the difference between the two? If it was very large, you might be able to draw ' +
          `a general conclusion about the two support types. If the two results were close, you'll probably nee` +
          'd to do more trials. Try another site configuration or load case. Again, change only one characteris' +
          'tic. If your second trial was a 4-meter high arch, you might use a 12 meter or 16 meter height for t' +
          'his next trial. Again, repeat the entire design process to optimize your truss for this new site con' +
          'figuration. Again, compare these results with the previous trials and use the comparison as the logi' +
          'cal basis for new exploration. As you conduct more trials, you will be able to eliminate uneconomica' +
          `l site configurations and load cases. When you've eliminated all but one, you have the optimum.`
  },
  {
    id: 'hlp_go_back',
    title: 'Go back button',
    text: 'Click the go back button to display the previous design iteration on the drawing board. Notes and ti' +
          `ps The go back button is located on the main toolbar. It's also available in the edit menu. Once you` +
          ' have used the go back button to display a previous design iteration, you can use the go forward but' +
          'ton to display a more recent iteration. You can also use the go to iteration button to display any d' +
          'esign iteration. The Bridge Designer remembers all your design iterations as long as remember my wor' +
          `k is checked in the edit menu. When it's unchecked, iterations are lost each time the browser is ref` +
          'reshed or restarted.'
  },
  {
    id: 'hlp_go_forward',
    title: 'Go forward button',
    text: 'Click the go forward button to display a more recent design iteration on the drawing board. Notes an' +
          'd tips The go forward button is located on the main toolbar. It can also be accessed from the edit m' +
          'enu . The go forward button is only activated after you have used the go back button at least once. ' +
          'You can also use the go to iteration button to display any design iteration. The Bridge Designer rem' +
          `embers all your design iterations as long as remember my work is checked in the edit menu. When it's` +
          ' unchecked, iterations are lost each time the browser is refreshed or restarted.'
  },
  {
    id: 'hlp_go_to',
    title: 'Go to iteration button',
    text: 'Click the go to iteration button to display the design iteration browser . Use the browser load the ' +
          'the drawing board with any design iteration . Once the browser is displayed, select an iteration, an' +
          'd click OK. Alternately, you can double click the iteration. Notes and tips Use the tree view tab to' +
          ' see how design iterations are related. The go to iteration button is located on the main toolbar. I' +
          `t's also available in the edit menu . The design iteration browser provides a preview window to help` +
          ' you select an iteration before actually loading it in the drawing board. You can also display previ' +
          'ous design iterations with the go back button. The Bridge Designer remembers all your design iterati' +
          `ons as long as remember my work is checked in the edit menu. When it's unchecked, iterations are los` +
          't each time the browser is refreshed or restarted.'
  },
  {
    id: 'hlp_grid_resolution',
    title: 'Grid resolution buttons',
    text: 'Use the Grid Resolution buttons to set the resolution of the drawing grid . The Drawing Board is cov' +
          `ered by a grid. (You can't see it, but it's there.) When you draw or move joints , your mouse "snaps` +
          '" to the grid line intersections, which are called snap points . Joints can only be drawn at the sna' +
          'p points. The Grid Resolution buttons are used to set the drawing grid to low, medium, or high resol' +
          'ution. At the low-resolution setting, you can place joints at 1.0 meter intervals. At the medium- an' +
          'd high-resolution settings, you can place joints at 0.5 meter and 0.25 meter intervals, respectively' +
          '. These three buttons work like "radio buttons." Only one of the three can be depressed at any given' +
          ' time When you click one, it remains depressed until you click either of the other two. Notes and ti' +
          'ps The Grid Resolution buttons are located on the Display Toolbar. They can also be accessed from th' +
          'e View menu. When you click any of the Grid Resolution buttons, the Rulers on the Drawing Board will' +
          ' be updated to reflect the new grid resolution. For example, at low grid resolution, the rulers will' +
          ' only display markings at 1.0 meter intervals. At high grid resolution, markings will be displayed a' +
          't 0.25 meter intervals. It is generally best to create your structural model using the low-resolutio' +
          'n grid, because it is easier to control the placement of joints in this mode. Once you begin optimiz' +
          'ing your design, you might want to switch to the medium- or high-resolution grid setting to refine t' +
          'he shape of your structural model more precisely. When editing your structural model, you can use th' +
          'e keyboard arrows to move joints at 0.25 meter intervals--regardless of the current grid resolution ' +
          'setting. Thus you can take advantage of the high-resolution grid, even without using the Grid Resolu' +
          'tion buttons.'
  },
  {
    id: 'hlp_how_to',
    title: 'How to design a bridge',
    text: 'When you use the Bridge Designer , you will experience the engineering design process in simplified ' +
          'form. You will design a steel truss bridge in much the same way a practicing civil engineers design ' +
          'real highway bridges. Your objective is to create an optimal bridge design. An optimal design is one' +
          ' that: satisfies all of the design specifications, , passes a simulated load test , and costs as lit' +
          'tle as possible. The diagram below shows an effective method to develop an optimal design. To learn ' +
          'more about this methodology: Click any block on the diagram for a detailed description of that parti' +
          'cular step, or... Click here to browse through the design process, one step at a time.'
  },
  {
    id: 'hlp_how_wpbd_works',
    title: 'How the bridge designer works',
    text: 'The Bridge Designer is intended for educational purposes only. When you use the Bridge Designer , yo' +
          'u will experience the engineering design process in simplified form. You will design a highway bridg' +
          'e in much the same way that practicing civil engineers design real highway bridges. You will be pres' +
          'ented with a requirement to design a steel truss bridge to carry a two-lane highway across a river. ' +
          'You may choose from a wide variety of different site configurations for your bridge. Each will cause' +
          ' your bridge to carry loads in a different way, and each has a different site cost . You will develo' +
          'p a design for your bridge by drawing a picture of it on your computer screen. Once your first desig' +
          'n attempt is complete, the Bridge Designer will test your bridge, to see if it is strong enough to c' +
          'arry the specified highway loads. This test includes a full-color animation showing a truck crossing' +
          ' your bridge. If your design is strong enough, the truck will be able to cross it successfully; if n' +
          'ot, the structure will collapse. If your bridge collapses, you can strengthen it by changing the pro' +
          'perties of the structural components that make up the bridge, or by changing the configuration of th' +
          'e bridge itself. Once your bridge can successfully carry the highway loading without collapsing, you' +
          ' can continue to refine your design, with the objective of minimizing its cost while still ensuring ' +
          'that it is strong enough to carry the specified loads. The Bridge Designer gives you complete flexib' +
          'ility to create designs using any shape or configuration you want. Creating a design is quick, so yo' +
          'u can experiment with many different alternative configurations as you work toward the best possible' +
          ` one. The process you'll use is quite similar to the one used by practicing civil engineers as they ` +
          'design real structures. Indeed, the Bridge Designer itself is quite similar to the computer-aided de' +
          'sign (CAD) software used by practicing engineers, and it will help you in the same way that CAD soft' +
          'ware helps them: by taking care of the heavy-duty mathematical calculations, so you can concentrate ' +
          'on the creative part of the design process. Good luck! Notes and tips To learn about how the Bridge ' +
          `Designer Cloud Edition differs from earlier versions, see " What's new in the Bridge Designer? ." Th` +
          'e Bridge Designer was developed by Brigadier General (Retired) Stephen Ressler. It was re-engineered' +
          ' (twice!) with open source by Brigadier General (Retired) Eugene Ressler. It is distributed freely u' +
          'nder provisions of the GNU Public License Version 3 , intended solely for educational use.'
  },
  {
    id: 'hlp_increase_member',
    title: 'Increase member size button',
    text: 'Click the increase member size button to increase the size of all currently selected members to the ' +
          'next larger. Notes and tips The increase member size button is located on the member properties tool' +
          'bar . If more than one member is selected, clicking this button will increase the size of all select' +
          'ed members , even if they are different. For example, if a 50mm member, a 90mm member, and a 120mm m' +
          'ember are all selected, clicking the button will change these to 55mm, 100mm, and 130mm, respectivel' +
          'y. When you use the increase member size button, the member size list is updated to reflect the chan' +
          'ge. When you use the increase member size button, the other two member properties lists - material a' +
          'nd cross-section type - are not changed.'
  },
  {
    id: 'hlp_joint_tool',
    title: 'Joint tool',
    text: 'Use the joint tool to draw joints as you create your structural model . Notes and tips The joint too' +
          `l is located on the design tools palette . It's also available in the tools menu . When the joint to` +
          'ol is selected, the mouse pointer appears as a cross-hair .'
  },
  {
    id: 'hlp_load_a_template',
    title: 'Load and display a template',
    text: 'The Bridge Designer includes a variety of truss templates, which you can load and display on the Dra' +
          'wing Board. The template will show you where to draw joints and members to create a stable structura' +
          'l model . To load and display a template: Click the Load Template button located in the File menu. S' +
          'elect a template, and click OK.. The template will be displayed on the Drawing Board. Notes and tips' +
          ' You must be in the Drawing Board Mode to load a template. Once a template is loaded, you can hide i' +
          't by clicking the View Template button.'
  },
  {
    id: 'hlp_load_combinations',
    title: 'Load combinations',
    text: 'Structural engineers use load combinations to account for the fact that structures often experience ' +
          'several different types of loads at the same time. For example, a bridge must simultaneously carry i' +
          'ts own weight, plus the weight of the traffic and pedestrians crossing it. But the bridge might also' +
          ' have to carry the loads caused by high winds, snow, ice, or even an earthquake. It is highly unlike' +
          'ly that all of these extreme loads could occur at exactly the same time. For this reason, most struc' +
          'tural design codes specify a number of different load combinations, each of which corresponds to a p' +
          'articular extreme event--a really heavy truck loading, or a really strong earthquake, for example. F' +
          'or each load combination, the extreme loading is combined with average levels of other loads that mi' +
          'ght be present at the same time the extreme event occurs. The 1994 AASHTO Bridge Design Specificatio' +
          'n requires bridge engineers to check eleven different load combinations for every bridge they design' +
          '. The Bridge Designer uses only one of these eleven. It is: Total Load = 1.25 Ws + 1.5 Ww + 1.75 T (' +
          '1+ DLA ) where: Ws = weight of the structure, including the deck and all structural components Ww = ' +
          'weight of the asphalt wearing surface T = weight of the AASHTO Truck Loading DLA = Dynamic Load Allo' +
          'wance The numbers 1.25, 1.5, and 1.75 are load factors . Notes and tips The fact that the Bridge Des' +
          'igner considers only one of eleven different code-specified load combinations is one important reaso' +
          'n why this software is for educational use only . For other reasons, see What is Not Realistic about' +
          ' BD .'
  },
  {
    id: 'hlp_load_template',
    title: 'Load template',
    text: 'Click the Load template button to load a standard truss template and display it on the Drawing Board' +
          ' . Notes and tips The Load Template button is located in the File menu .'
  },
  {
    id: 'hlp_load_test3',
    title: 'Load test animation',
    text: 'The load test animation is a graphical simulation of your bridge undergoing the load test . To initi' +
          'ate the animation, click the Load Test button . As the animation begins, your bridge is subjected to' +
          ' its own weight--the weight of the steel structural elements, the concrete deck , and the asphalt we' +
          'aring surface . Once the self-weight is applied, the AASHTO H25 truck moves across the bridge from l' +
          'eft to right. As the loads are applied, the bridge bends downward. The displacements of the bridge a' +
          're exaggerated by a factor of 10, to illustrate how truss members shorten and elongate as they carry' +
          ' load. As the member forces increase, the members change color-- red for compression and blue for te' +
          'nsion . The more intense the color, the closer the member is to failure. If one or more members are ' +
          'found to be unsafe , the animation includes a depiction of these members failing and the resulting c' +
          'ollapse of the bridge. Notes and tips You can pause, rewind, and restart the animation at any time, ' +
          'using the Animation Controls. You can change the appearance of the load test animation or opt not to' +
          ' show it at all by changing the Load Test Options . Whenever a member is found to be unsafe, the loa' +
          'd test animation depicts the failure of that member, in either the yielding or buckling failure mode' +
          '. This depiction is not entirely realistic. Engineers always build a substantial margin of safety in' +
          'to the design of structural members. This margin of safety is represented by the load factors in cod' +
          'e-specified load combinations and by the resistance factors in the equations for tensile strength an' +
          'd compressive strength. An unsafe member might fail, or it might continue to carry load with a reduc' +
          'ed margin of safety. In an actual bridge, it is possible for one or more members to fail without cau' +
          'sing the total collapse of the structure. However, if any member is found to be unsafe, the Bridge D' +
          'esigner considers the design to be unsuccessful.'
  },
  {
    id: 'hlp_load_test_button',
    title: 'Load test button',
    text: 'Click the Load Test button to load test your current design. Notes and tips The Load Test button is ' +
          'located on the Main Toolbar. It can also be accessed from the Test menu . The Load Test button and t' +
          'he Drawing Board button work like "radio buttons." Only one of the two can be depressed at any given' +
          ' time. When you click one, it remains depressed until you click the other.'
  },
  {
    id: 'hlp_load_test_options',
    title: 'Load test options',
    text: 'Attempt to fix unstable structure automatically has been replaced by the Auto-correct errors check b' +
          'ox in the Test menu. If this is switched on, the Bridge Designer will attempt to identify the source' +
          ' of instability in an unstable structural model and modify the structure so that it can be load-test' +
          'ed. These modifications might include deleting an unattached joint, adding a new member, or breaking' +
          ' a member into two or more shorter ones. The modifications might not be successful, depending on the' +
          ' type and extent of instability. Nonetheless, we strongly recommend that you keep this option switch' +
          'ed on. Display the animation has been replaced by the Show Animation check box in the Test menu. If ' +
          'this is switched on, the load test animation is displayed on every load test. If this option is off,' +
          ' the animation is not shown, and the user is returned immediately to the Drawing Board Mode after ea' +
          'ch load test. Show exaggerated displacements has been replaced by the Exaggeration check box in the ' +
          'Animation controls palette . If this is switched on, the bending of the bridge is exaggerated by a f' +
          'actor of 10, to illustrate how truss members shorten and elongate as they carry load. If this option' +
          ' is off, displacements are not exaggerated. Show color-coded member forces has been replaced by the ' +
          'Colors check box in the Animation controls palette . If this is switched on, members change color du' +
          'ring the animation. The color represents the magnitude of the member force : red for compression and' +
          ' blue for tension . The more intense the color, the closer the member is to failure. If this option ' +
          'is off, the members do not change color during the animation. Notes and tips In the Bridge Designer ' +
          ', changing speed has no effect on the amount of memory or processor time used for the animation, tho' +
          'ugh it did in earlier versions. If you have an older computer that does not perform well with the ne' +
          'w game-quality animation graphics, use the Test menu to check the Use Old-Style Graphics checkbox. T' +
          'he two options that should be turned off to make your bridge appear as realistic as possible are now' +
          ' both available in the Animation controls palette . They are Exaggeration and Colors .'
  },
  {
    id: 'hlp_load_test_status',
    title: 'Load test status',
    text: 'The current status of your design is displayed as an icon on the Status toolbar. Your design will al' +
          'ways be in one of three possible states: Under Construction . The structural model is not yet comple' +
          'ted, or it has been changed since the last load test. Unsafe . The structural model has been load te' +
          'sted, and one or more members are not strong enough to safely carry the specified loads . Safe . The' +
          ' structural model has been load tested, and all members are strong enough to safely carry the specif' +
          'ied loads. Notes and tips Anytime you make a change to your structural model, the status will change' +
          ' to Under Construction until you run the load test again. To get detailed numerical results of the m' +
          'ost recent load test , click the Report Load Test Results button or view the Member List.'
  },
  {
    id: 'hlp_local_contest',
    title: 'Local contest code',
    text: 'The Bridge Design Contest (BDC) includes support for two different types of local bridge design cont' +
          'ests. In either case, a contest code is issued to the local contest organizer by the national BDC Co' +
          'ordinator. The first type, which uses a 4-character Local Contest Code , is best when the national B' +
          'DC is in progress. Any bridge submitted to the local contest simultaneously competes in the national' +
          ' contest. A 6-character Local Contest Code is restricted to a single site configuration and load cas' +
          'e. The designated site configuration and load case are embedded in the Local Contest Code. For this ' +
          'reason, the Bridge Designer allows the user to input a six-character Local Contest Code at the start' +
          ' of each new design. Local Contest Code entry is included as Step 2 in the Design Project Setup Wiza' +
          'rd .The advantage of a 6-character contest is that students quickly produce competitive bridges for ' +
          'the single site. A disadvantage occurs if the national BDC is in progress: Bridges designed for the ' +
          'local contest are unlikely to be competitive nationally due to the site restriction. To enter a Loca' +
          'l Contest Code: Click the New Design button to display the Design Project Setup Wizard . At Step 2 i' +
          'n the Wizard, check Yes to indicate which type of Local Contest Code (4-character or 6-character) yo' +
          'u will be using. If you are using a 6-character Local Contest Code, enter it in the text box. Notes ' +
          'and tips The first three characters of a 6-character Local Contest Code uniquely identify the local ' +
          'contest (e.g., NHS for Northampton High School). The next two characters are a two-digit number repr' +
          'esenting the site configuration (i.e., the deck elevation and supports). The final character is a le' +
          'tter (A, B, C, or D) designating the Load Case. The load case consists of one of the two truck avail' +
          'able loadings combined with one of the two available concrete deck thicknesses. As soon as a valid 6' +
          '-character Local Contest Code is entered in the Design Project Setup Wizard, the corresponding site ' +
          'configuration and load case are displayed in the Preview window.'
  },
  {
    id: 'hlp_material_densities',
    title: 'Material density',
    text: 'The density of a material is its mass per unit volume. The Bridge Designer uses material densities a' +
          's specified in the 1994 AASHTO Bridge Design Specifications, as follows: Material Density Reinforced' +
          ' Concrete 2400 kg per cubic meter Asphalt 2250 kg per cubic meter Steel (all types) 7850 kg per cubi' +
          'c meter'
  },
  {
    id: 'hlp_materials',
    title: 'Materials',
    text: 'The Bridge Designer allows you to use three different materials in your design: Carbon steel. This i' +
          's the most common grade of structural steel, composed primarily of iron and about 0.26% carbon. High' +
          '-Strength Low-Alloy steel. This increasingly popular structural steel is similar to carbon steel but' +
          ' significantly stronger. The higher strength is attained from small amounts of manganese, columbium,' +
          ' vanadium, and other alloying elements added during the manufacturing process. Quenched and Tempered' +
          ' Low-Alloy Steel. This very high-strength steel is similar to high-strength low-alloy steel, but its' +
          ' strength is further increased through a special heat-treating process. Notes and tips Which materia' +
          'l is the best choice for a given structural design? The answer depends largely on the relative impor' +
          'tance of cost and strength (yield stress) in the design. Carbon steel is the least expensive of the ' +
          'three alternatives, but it also has the lowest strength. High-strength low-alloy steel is somewhat m' +
          'ore expensive but about 40% stronger than carbon steel. Quenched and tempered low-alloy steel is bot' +
          'h the strongest and most expensive of the three. All three materials have approximately the same den' +
          'sity and modulus of elasticity . The "best" material often varies from structure to structure, and a' +
          ` given design may use more than one material. You'll need to do some experimenting to determine whic` +
          'h materials are best for your design. To determine the actual numerical values of yield stress , mas' +
          's density , and modulus of elasticity for a given material, click the Report Member Properties butto' +
          'n. To determine the unit cost of a material, click the Report Cost Calculations button.'
  },
  {
    id: 'hlp_member_details',
    title: 'Member details',
    text: 'Member Details is an interactive explorer that displays detailed engineering information about the m' +
          'aterials , cross-sections , and sizes of all selected members . When no members are selected, it dis' +
          'plays information about all the members in the Member properties lists. Member Details and the Membe' +
          'r List occupy the same screen location. If the Member List is visible, you can change to Member Deta' +
          'ils by clicking its tab at the upper right corner. The Member Details include: Material properties: ' +
          'yield stress modulus of elasticity mass density Cross-section properties: cross-sectional area momen' +
          't of inertia A graph of member strength vs. length, for both tension (yielding) and compression (buc' +
          'kling). The maximum member length passing the slenderness test is also shown. The cost per meter of ' +
          'a member made with the selected material, cross-section, and size. If members are selected a separat' +
          'e Members tab is presented for each set of members consisting of the same material and cross-section' +
          '. The lengths of these members are drawn as vertical lines on the strength curve with one highlighte' +
          'd. The highlighted member can be selected with the Member: selector . Click the arrow buttons or sel' +
          'ect a member number from the drop down list. All tabs can be drawn on a single strength curve by sel' +
          'ecting the check box. Notes and tips Member length and cost will be shown in the Member Details only' +
          ' when exactly one member is selected.'
  },
  {
    id: 'hlp_member_list',
    title: 'Member list',
    text: 'The Member List is a movable grid that is normally displayed on the right-hand side of the Bridge De' +
          'sign Window. When in use, the Member List reduces space available for the Drawing Board; however, it' +
          ' can be easily hidden in order to view or edit the structural model . The Member List and Member Det' +
          'ails occupy the same screen location. If Member Details are visible, you can change to the Member Li' +
          'st by clicking its tab at the upper right corner. The Member List does the following: Lists all of t' +
          'he members in the current structural model. Lists the engineering properties (length, material, cros' +
          's-section, member size , and slenderness ratio ) of each member. Provides the most recent load test ' +
          'results for each member. Provides a convenient means of selecting one or more members. Provides a me' +
          'ans of sorting members--by member number, by engineering properties, or by load test results. Notes ' +
          'and tips In the Member List, load test results are shown as a ratio of member force to strength, for' +
          ' both compression and tension . Thus, if the ratio is greater than 1, the member is unsafe . (Member' +
          's that are unsafe in tension are highlighted in blue ; those that are unsafe in compression are high' +
          'lighted in red .) If the ratio is less than 1, the member is safe . If the ratio is much less than 1' +
          ', the member is much stronger than it really needs to be and therefore is probably uneconomical. The' +
          ' Member List can be hidden and restored with the View Member List button . It can also be closed wit' +
          'h the the button at the upper right. To hide the Member List entirely, click the View Member List bu' +
          'tton. If the list is already hidden, click the same button to restore it. To select a member, click ' +
          'anywhere within the corresponding row of the Member List. A selected member is highlighted in light ' +
          'blue , both in the Member List and on the Drawing Board. You can click and drag with the mouse butto' +
          'n down to select a range of members. Alternately you can select a range by clicking on one member, h' +
          'olding the Shift key down, and clicking a second member. This selects both of the clicked members an' +
          'd all members between To select more than one member simultaneously, hold down the Ctrl key while cl' +
          'icking the Member List. To sort the Member List, click the heading of the column you want to sort by' +
          '. For example, to sort members by length , click the heading of the Length column. The first time yo' +
          'u click a column heading, the list will be sorted in ascending order; if you click the same button a' +
          ' second time, it will be sorted in descending order. The Member List can be used to optimize the mem' +
          'ber properties in your structural model very efficiently. Immediately following a Load Test, sort th' +
          'e Member List by compression load test results. (Click Compression Force/Strength column heading.) T' +
          'he list will be sorted from most safe to least safe . Any unsafe members will be at the bottom of th' +
          'e list (highlighted in red ), and any excessively strong (i.e., uneconomical) members will be at the' +
          ' top. Now you can select a block of members that needs to be made larger or smaller (see the discuss' +
          'ion of block selection above), then use the Increase Member Size button or the Decrease Member Size ' +
          'button to make the appropriate change to the entire selected block. Repeat the process for tension l' +
          'oad test results.'
  },
  {
    id: 'hlp_member_properties',
    title: 'Member properties lists',
    text: 'Use the three Member Properties lists to define the material, cross-section, and member size for eac' +
          'h member in your structural model . To choose a member property, click the drop-down button to revea' +
          'l all of the list items, then click the item you want. The Member Size list can also be updated usin' +
          'g the Increase Member Size button and the Decrease Member Size button. Notes and tips The Member Pro' +
          'perties lists are located on the Member Properties Toolbar. When adding new members, the material, c' +
          'ross-section, and size currently displayed in the three Member Properties lists are automatically as' +
          'signed to each new member as it is created. When editing the structural model, the Member Properties' +
          ' lists are used to change the properties of the currently selected member(s).'
  },
  {
    id: 'hlp_member_tool',
    title: 'Member tool',
    text: 'Use the Member tool to draw members as you create your structural model . Notes and tips The Member ' +
          'tool is located on the Design Tools palette. It can also be accessed from the Tools menu. When the M' +
          'ember tool is selected, the mouse pointer appears as a pencil .'
  },
  {
    id: 'hlp_menu_bar',
    title: 'Menu bar',
    text: 'The Menu Bar is located at the top of the Bridge Design Window, immediately below the Title Bar. The' +
          ' Menu Bar provides the following commands: File New design Open file Save file Save as Open a sample' +
          ' design Load template Print the design Recently opened files Exit Edit Select all Delete Undo Redo G' +
          'o back Go forward Go to iteration View Design tools Animation controls Member list Rulers Title bloc' +
          'k Member numbers Symmetry guides Template Grid resolution Drawing Tools Joint tool Member tool Selec' +
          't tool Eraser tool Test Drawing board Load test Show animation Use old-style graphics Auto-correct e' +
          'rrors Report Cost calculations Load test results Help Tip of the day'
  },
  {
    id: 'hlp_move_joint',
    title: 'Move a joint',
    text: 'To move a joint with the mouse: Click the Select tool on the Design Tools palette. Position the mous' +
          'e pointer over the joint you want to move. Press the left mouse button, and hold it down. Move the m' +
          'ouse pointer to the new joint location, and release the button. The joint will be redrawn at the new' +
          ' location. To move a joint with the keyboard: Click the Select tool on the Design Tools palette. Cli' +
          'ck on the joint you want to move. The selected joint will turn light blue . Use the arrow keys on yo' +
          'ur keyboard to move the joint in the desired direction, in 0.25 meter increments. Notes and tips You' +
          ' must be in the Drawing Board Mode to move a joint. If the joint already has members attached to it,' +
          ' these members will be automatically repositioned along with the joint. The joints created automatic' +
          'ally by the Bridge Designer when you start a new design cannot be moved. You cannot move one joint o' +
          'n top of another joint. For site configurations with a high pier , joints cannot be moved onto the p' +
          'ier. When a joint is dragged with the mouse, the joint moves in increments corresponding to the curr' +
          'ent resolution of the drawing grid . When a joint is moved with the keyboard, it moves in 0.25 meter' +
          ' increments, regardless of the current grid resolution. Thus the keyboard technique is particularly ' +
          'effective for making small adjustments in the position of a joint.'
  },
  {
    id: 'hlp_multiple_selection',
    title: 'Multiple selection of members',
    text: 'Use multiple selection to change the properties of several members simultaneously or to delete sever' +
          'al members simultaneously. There are five different ways to do multiple selection. Drag a box: Click' +
          ' the Select tool on the Design Tools palette. While holding down the left button of the mouse, "drag' +
          ' a box" around the members you want to select, then release the mouse button. All members that are e' +
          'ntirely enclosed within the box will be selected. Ctrl-Click on the Drawing Board: Click the Select ' +
          'tool on the Design Tools palette. Hold down the Ctrl key on your keyboard. On the Drawing Board, ind' +
          'ividually click each of the members you want to select. Ctrl-Click in the Member List: Hold down the' +
          ' Ctrl key on your keyboard. In the Member List, individually click each of the members you want to s' +
          'elect. Shift-Click in the Member List (block selection): In the Member List, click one member to sta' +
          'rt a "block." Hold down the Shift key on your keyboard. In the Member List, click a second member to' +
          ' complete the block. All members listed between the first and second (inclusive) will be selected. C' +
          'lick-and-Drag in the Member List (block selection): In the Member List, click one member to start a ' +
          '"block." Drag up or down and then release to select the desired block. Select All: Click the Select ' +
          'All button on the Main Toolbar. Every member in your structural model will be selected. Notes and ti' +
          'ps All selected members turn light blue , both on the Drawing Board and in the Member List. To de-se' +
          'lect all selected members, click anywhere on the Drawing Board other than on a member. To de-select ' +
          'a single member without de-selecting the remaining members of a multiple selection, hold down the Ct' +
          'rl key and click the member you want to de-select.'
  },
  {
    id: 'hlp_new_design',
    title: 'New design button',
    text: 'Click the New Design button to start a new bridge design. When you click the button, the Design Proj' +
          'ect Setup Wizard will be displayed. Notes and tips The New Design button is located on the Main Tool' +
          'bar. It can also be accessed from the File menu.'
  },
  {
    id: 'hlp_not_realistic',
    title: 'What is',
    text: 'not realistic about the Bridge Designer? One of the purposes of the Bridge Designer is to provide a ' +
          'realistic , hands-on experience that will help you to understand how civil engineers design real str' +
          'uctures. Many aspects of the software accurately reflect the structural design process; however, a n' +
          'umber of significant compromises have been made to keep the program from getting too complex. Bridge' +
          ' Designer is intended as an introduction to engineering design, with emphasis on the design process ' +
          ', rather than the detailed technical aspects of structural design. The bottom line is that some aspe' +
          'cts of the Bridge Designer are realistic, and some are not. It is important that you understand the ' +
          'difference. The following aspects of the Bridge Designer do not accurately reflect the process that ' +
          'practicing civil engineers use to design real bridges: In designing an actual bridge, engineers must' +
          ' developed detailed designs and cost estimates for the abutments , the piers , the roadway, the deck' +
          ' , and the complete three-dimensional structural system, including the main trusses, all connections' +
          ' , the concrete deck, its supporting steel framing, and many secondary members . Engineers would als' +
          'o need to consider the environmental impact of the bridge and the effects of water and ice in the ri' +
          'ver channel as an integral part of the design. In Bridge Designer you only design the main trusses a' +
          'nd make some preliminary decisions about the configurations of the roadway and supports. The design ' +
          'is strictly two-dimensional and thus does not account for three-dimensional stability. In designing ' +
          'an actual bridge, engineers must consider the effects of fatigue --the tendency of a structural mate' +
          'rial to fail prematurely as a result of the repetitive loading caused by vehicular traffic. Bridge D' +
          'esigner does not consider fatigue. In designing an actual bridge, engineers must consider many diffe' +
          'rent types of loading, to include several different forms of vehicular loads , self-weight, wind, sn' +
          'ow, collision by vehicles and ships, and earthquakes. They must consider both the longitudinal and l' +
          'ateral position of the vehicular loads on the bridge deck. They must also consider numerous load com' +
          'binations --eleven in the 1994 AASHTO Bridge Design Specification. Bridge Designer considers only tw' +
          'o types of vehicular loading and the self-weight of the bridge. It considers only the longitudinal p' +
          'osition of the vehicular loading, not the lateral position. In designing an actual bridge, engineers' +
          ' must consider limitations on deflections --the amount of bending that occurs when a vehicle crosses' +
          ' the bridge. Bridge Designer calculates deflections and displays them during the load test , but doe' +
          's not use them as a design criterion. In designing an actual bridge, engineers must consider many ad' +
          'ditional member failure modes not considered by the Bridge Designer . In the Bridge Designer load te' +
          'st, the AASHTO truck loading represents two lanes of highway traffic, and this loading is moved acro' +
          'ss the bridge in one direction - from left to right. The AASHTO loading has a heavy rear axle and a ' +
          'lighter front axle. Because this loading is asymmetrical, an optimally designed bridge might be asym' +
          'metrical as well. However, the design of real bridges must consider the movement of the AASHTO loadi' +
          'ng in both directions: left to right and right to left. As a result, optimally designed real-world b' +
          'ridges are generally symmetrical. Though Bridge Designer attempts to accurately demonstrate the cost' +
          ' tradeoffs inherent in engineering design, the actual costs of the structural materials and componen' +
          'ts used in the software are not intended to be accurate. In designing an actual bridge, engineers mu' +
          'st consider esthetics . Bridge Designer does not include esthetics as a design criterion, though you' +
          ' can certainly set a personal goal to design only good-looking bridges! It is important to recognize' +
          ' that these limitations exist. But it is equally important to understand what is realistic about the' +
          ' Bridge Designer.'
  },
  {
    id: 'hlp_old_style_graphics',
    title: 'Use old-style graphics check box',
    text: 'The Cloud Edition load test animation uses game-quality high speed graphics to let you move around t' +
          'he bridge while it is being tested and to see what the truck driver sees as she traverses a successf' +
          'ul bridge. Some computers do not support these advanced graphics. If nothing happens when you select' +
          ' 3D load test animation , or if your computer misbehaves in some other way, then you have one of the' +
          'se computers. Fix the problem by restarting the Bridge Designer and checking the menu entry at Tools' +
          ' , Use Old-Style Graphics . This causes the 3D load test animation to be shown using basic graphics ' +
          'that work on virtually all computers. Notes and tips Most newer computers support the advanced graph' +
          'ics features needed by the Cloud Edition.'
  },
  {
    id: 'hlp_open_existing',
    title: 'Open an existing bridge design file',
    text: 'To open an existing bridge design file: Click the Open File button on the Main Toolbar. Choose the d' +
          'isk drive, folder, and filename you want to open, then click OK. Notes and tips The default file ext' +
          'ension for bridge design files created in the Bridge Designer is .bdc. The Bridge Designer cannot re' +
          'ad the .bdf , .bd4, and bdc bridge design files created with earlier versions of the software. Sorry' +
          '. Backward compatibility is impossible with Bridge Designer , because of its use in an annual bridge' +
          ' design contest. If your current design has not been saved, you will be prompted to save it before y' +
          'ou open a file.'
  },
  {
    id: 'hlp_open_file',
    title: 'Open file button',
    text: 'Click the Open File button to open an existing bridge design file. Notes and tips The Open File butt' +
          'on is located on the Main Toolbar. It can also be accessed from the File menu.'
  },
  {
    id: 'hlp_open_sample_design',
    title: 'Open a sample design',
    text: 'The Bridge Designer includes a variety of sample designs, which you can open, modify, and load test ' +
          '. All of these are stable truss configurations, but none of them are optimized for minimum cost. To ' +
          'load a sample design: Click the Open sample design entry of the File menu. Select a sample design, a' +
          'nd click OK.. The sample design will be displayed on the Drawing Board. Notes and tips You must be i' +
          'n the Drawing Board Mode to load a sample design. If your current structural model has not been save' +
          'd, you will be prompted to save it before the sample design is loaded.'
  },
  {
    id: 'hlp_optimize_configuration',
    title: 'Optimize the shape of the truss',
    text: 'How to design a bridge Go back one step Go forward one step At this point in the design process, you' +
          ' have optimized the member properties for one specific truss configuration. But there are probably o' +
          'ther configurations that will result in more economical designs. Design is inherently an iterative p' +
          'rocess. To achieve a truly optimal design, you will need to experiment with many different configura' +
          'tions, and carefully observe how changes in the truss geometry affect the cost of your design. Befor' +
          'e you try a totally new truss configuration, you should first optimize the shape of your current str' +
          'uctural model . You can change the shape of the truss by moving one or more joints --by dragging the' +
          'm to a new location with your mouse or keyboard. This modification is very easy to do and can produc' +
          'e significant reductions in the cost of your design. To optimize the shape of your current structura' +
          'l model: Try changing the depth of your truss. For example, suppose you started with the standard Pr' +
          'att Through Truss for your current design: You might try reducing its depth: And you might try incre' +
          'asing its depth: At first glance, reducing the depth of the truss might seem like the better alterna' +
          'tive. Reducing the depth will make the verticals and diagonals shorter and, since these members will' +
          ' require less material, their cost will decrease. However, reducing the depth of a truss also causes' +
          ' the member force in the top and bottom chords to increase . Thus you will probably need to increase' +
          ' the size (and cost) of the top and bottom chord members to ensure that the design still passes the ' +
          'load test . If you increase the depth of the truss, the opposite effects will occur. The verticals a' +
          'nd diagonals will get longer and, thus, they will increase in cost. But the member forces in the top' +
          ' and bottom chords will decrease, allowing you to use smaller, less expensive members for the chords' +
          '. There is a trade-off between these two competing factors: (1) the member force in the top and bott' +
          'om chords and (2) the length of the verticals and diagonals. Every truss has an optimum depth, which' +
          ' represents the best compromise between these two factors. The best way to find the optimum depth fo' +
          'r your design is through trial and error. Try changing the overall shape of your truss. For example,' +
          ' suppose you started with the standard Pratt Through Truss for your current design: Try moving the t' +
          'op-chord joints to create a more rounded shape: Often this minor adjustment can reduce the cost of a' +
          ' design significantly. When a truss has this rounded shape, the member forces tend to be nearly equa' +
          'l in every member in the top chord. Thus, if you get the shape just right, you can use a single opti' +
          'mum member size for the entire top chord--resulting in a substantial reduction in product cost. Chan' +
          'ging to a more rounded shape is also effective for the bottom chord of a deck truss : Notes and tips' +
          ' Whenever you change the shape of your truss, you will need to repeat the previous three steps in th' +
          'e design process: (1) run the load test, (2) identify and strengthen all unsafe members, and (3) opt' +
          'imize the member properties. Only then can you determine whether or not the change was effective in ' +
          'reducing the cost of your design.'
  },
  {
    id: 'hlp_optimize_member_selection',
    title: 'Optimize the member properties',
    text: 'How to design a bridge Go back one step Go forward one step Once your structural model has no unsafe' +
          ' members , your design is successful . However, your design is not optimum until you minimize its co' +
          'st. The first step in optimizing your design is to minimize the cost of your current truss configura' +
          'tion by optimizing the member properties -- material, cross-section, and member size . At this stage' +
          ' in the design process, you should not change the shape or configuration of your current structural ' +
          'model. To optimize the member properties: Ensure that you understand how the Bridge Designer calcula' +
          'tes the cost of your design. In particular, understand the trade-off between material cost and produ' +
          'ct cost . Minimize the material cost . There are several approaches you might use to minimize materi' +
          'al cost; the following procedure is recommended for inexperienced designers: Start by using the lowe' +
          'st cost (but weakest) available material - carbon steel - for all members. Select an appropriate cro' +
          'ss-section for each member. It is usually best to use solid bars for tension members and hollow tube' +
          's for compression members. For more information, see Solid Bar or Hollow Tube? Now use a systematic ' +
          'trial and error procedure to determine the smallest possible member size for every member in the str' +
          'uctural model. Starting with a successful design, decrease the size of every member to the next smal' +
          'ler available size. (See Change the Properties of a Member for more information.) Then run the load ' +
          'test again. If any member fails, its size is too small; change it back to its previous (larger) size' +
          '. For each member that is safe , decrease its size again, and run the load test. Keep reducing its s' +
          'ize and running the load test until the member fails, then increase its size by one. If you use this' +
          ' process systematically for every member in the structural model, you will ensure that every member ' +
          'is as small (and inexpensive) as it can possibly be without failing. Finally, go back and check if u' +
          'sing either of the other two materials--high-strength steel or quenched and tempered steel--will red' +
          'uce the overall cost of the design. Both of these steels have significantly higher yield stress than' +
          ' carbon steel, so using them will allow you to reduce the size of members without reducing their str' +
          'ength. But both high-strength steel and quenched and tempered steel are more expensive (in dollars p' +
          'er kilogram) than carbon steel. You will need to use trial and error to determine if the benefit of ' +
          'increased strength is sufficient to offset greater cost of the high-strength steels. It is permissib' +
          'le to use two or three different materials in the same design. Once you have adjusted the materials,' +
          ' cross-sections, and member sizes to minimize the material cost of your design, be sure to run the l' +
          'oad test once more to ensure that all members are safe. Optimize, based on product cost . When you m' +
          'inimized the material cost (above), you probably introduced a large number of different products int' +
          'o your design. Thus, even though your material cost is low, your product cost is probably quite high' +
          ', and your total cost is almost certainly not optimum. Use the following procedure to find the best ' +
          'balance between these two competing cost factors: Check the Cost Calculations Report to see how many' +
          ' products are currently included in your design. In particular, identify any products that are used ' +
          'for only a few members in your structural model. Change the properties of these particular members t' +
          'o match the next larger (or next stronger) available product in your current design. For example, su' +
          'ppose your design includes two 40 mm solid carbon steel bars and four 60 mm solid carbon steel bars.' +
          ' Change the two 40 mm bars to 60 mm bars. This modification will increase the material cost somewhat' +
          ', but will reduce the number of products by one. This modification will probably not reduce the safe' +
          'ty of the structure, since you are making the two 40 mm members stronger . If the reduction in produ' +
          'ct cost exceeds the increase in material cost, the change is a good one. If not, reject the change b' +
          'y clicking the Undo button . Continue this trial-and-error process of selectively increasing member ' +
          'sizes (or using stronger materials) to reduce the total number of products in the design. Generally,' +
          ' you will find that reducing the number of products creates substantial cost savings at first; howev' +
          'er, as the degree of standardization increases, the cost savings get progressively less. Ultimately,' +
          ' too much standardization will cause the total cost of the design to rise. The design that minimizes' +
          ' total cost is the optimum. Before moving on to the next step in the design process, be sure to run ' +
          'the load test one more time, even if all of your modifications involved making members larger . Incr' +
          'easing the size of a member makes that member both stronger and heavier. When member weights increas' +
          'e, the total weight of the truss increases. As a result of this increase in load, member forces will' +
          ' also increase, and some members which were previously safe might become unsafe. Notes and tips You ' +
          'can optimize member properties very efficiently by taking full advantage of the sorting and multiple' +
          ' selection capabilities of the Member List.'
  },
  {
    id: 'hlp_pinned_support',
    title: 'Pinned support',
    text: 'A pinned support, represented by this symbol, prevents a joint in the structural model from moving b' +
          'oth horizontally and vertically.'
  },
  {
    id: 'hlp_print_drawing',
    title: 'Print a drawing',
    text: 'Click the Print button on the Main Toolbar to send a black-and-white drawing of your design to your ' +
          'printer . Notes and tips The printed drawing shows the configuration of your truss annotated with me' +
          'mber numbers and dimensions. Member properties are shown in tabular format at the bottom of the page' +
          `. Many bridges will look best printed in "landscape" mode. That's with the bridge oriented across th` +
          `e longest dimension of the page. With most web browsers, you'll be able to choose this in the dialog` +
          ' that appears immediately after pressing Print.'
  },
  {
    id: 'hlp_print_load_test',
    title: 'Print the load test results',
    text: 'To print a report of your most recent load test: Ensure that the printer is connected and on line. C' +
          'lick the Report Load Test Results button on the Status Toolbar . The Load Test Results Report will b' +
          'e shown as a table in a separate window. Click the Print button in the right-hand side of the window' +
          `. Follow your browswer's printing instructions to send the report to your printer. Notes and tips Th` +
          'e Load Test Results Report can also be copied to the Windows Clipboard by clicking the Copy button o' +
          'n the right-hand side of the window. The data are copied in tab-delimited text format. In this forma' +
          't, they can be pasted directly into a Microsoft Excel spreadsheet or a Word or Notepad document.'
  },
  {
    id: 'hlp_printer',
    title: 'Printers and printing',
    text: `The Bridge Designer makes use of your web browser's printing capability to print bridges. Check with` +
          ` the browser's maker for details on how to select the printer and set it up, for example choosing la` +
          'ndscape or portrait mode.'
  },
  {
    id: 'hlp_purposes',
    title: 'Purposes',
    text: 'The purposes of the Bridge Designer are: to provide you with an opportunity to learn about the engin' +
          'eering design process; to provide a realistic, hands-on experience that will help you to understand ' +
          'how civil engineers design structures; to demonstrate how engineers use the computer as a tool to im' +
          'prove the effectiveness and efficiency of the design process; to provide a tool for visualizing stru' +
          'ctural behavior--a tool that will help you to understand how structures work; and Notes and tips For' +
          ' an overview of the software and its functions, see How the Bridge Designer Works . The Bridge Desig' +
          'ner was developed by Brigadier General Stephen Ressler. The 2nd edition series of the Bridge Designe' +
          'r, including Windows and Mac OS X versions, was developed by Colonel Eugene Ressler. All versions ar' +
          'e distributed freely under provisions of the GNU Public License , intended solely for educational us' +
          'e.'
  },
  {
    id: 'hlp_realistic',
    title: 'What is realistic about the bridge designer?',
    text: 'One of the purposes of the Bridge Designer is to provide a realistic , hands-on experience that will' +
          ' help you to understand how civil engineers design real structures. Many aspects of the software acc' +
          'urately reflect the structural design process; however, a number of significant compromises have bee' +
          'n made to keep the program from getting too complex. Bridge Designer is intended as an introduction ' +
          'to engineering design, with emphasis on the design process , rather than the detailed technical aspe' +
          'cts of structural design. The bottom line is that some aspects of the Bridge Designer are realistic,' +
          ' and some are not. It is important that you understand the difference. The following aspects of the ' +
          'Bridge Designer reflect, with reasonable accuracy, the nature of engineering design and the process ' +
          'that practicing civil engineers use to design real bridges: Design is an open-ended process. Real-wo' +
          'rld design problems always have many possible solutions. Bridge Designer demonstrates this aspect of' +
          ' the design process by allowing you much freedom in developing the configuration of your bridge. Tho' +
          'ugh design is open-ended, the process is always constrained by real-world conditions and restriction' +
          's. Bridge Designer demonstrates this aspect of the design process by limiting your design to specifi' +
          'c span lengths and support configurations that conform to the conditions of the project site; by lim' +
          'iting your choices of available materials and member types; and by imposing the requirement to minim' +
          'ize cost. Design is inherently an iterative process. Because engineers usually work with incomplete ' +
          'information, they must often make assumptions, then subsequently check and revise those assumptions ' +
          'as the design process progresses. Developing a high-quality solution always requires the engineer to' +
          ' consider many different design alternatives, and ultimately select the best one. Bridge Designer cl' +
          'early demonstrates this aspect of the design process. It is impossible to achieve a truly optimal br' +
          'idge design without considering many different alternative truss configurations, materials, cross-se' +
          'ctions, and member sizes. Design always involves trade-offs. It is usually not possible to find a si' +
          'ngle design solution that best satisfies all design criteria. Making improvements in one area often ' +
          'causes unexpected problems somewhere else. You will experience many of these same trade-offs when yo' +
          'u use Bridge Designer . For example, as you attempt to optimize your design, you will discover that ' +
          'reducing the depth of a truss causes the cost of the verticals and diagonals to decrease (because th' +
          'ey get shorter); but it also causes the cost of the top and bottom chords to increase (because their' +
          ' member force increases, and a larger member sizes are needed to preserve structural safety ). As in' +
          ' real-world structural design, you will need to find the optimum balance between the two competing c' +
          'riteria. Structural engineering design is regulated through the use of codes . Codes ensure that eng' +
          'ineering is practiced in a consistent, safe manner throughout the country, region, or municipality. ' +
          'There are separate, industry-standard codes governing the design of steel, concrete , and wood struc' +
          'tures. There are regional and local building codes that specify design loads , fire protection stand' +
          'ards, and many other requirements for designing buildings. Design of highway bridges in the U.S. is ' +
          'governed by the AASHTO Bridge Design Specification. In Bridge Designer , the load test uses a standa' +
          'rd (but slightly modified) AASHTO truck loading, and the compressive and tensile strengths of member' +
          's are computed exactly as specified in the AASHTO Specification. Structures are generally designed s' +
          'uch that they can safely carry one or more code-specified loadings. Minimizing cost is also often an' +
          ' important objective--but never as important as structural safety. Cost reductions can never be made' +
          ' if those reductions compromise structural safety. The formulation of Bridge Designer is based on th' +
          'is same relationship between safety and cost. In Bridge Designer your design objective is to minimiz' +
          'e cost, but a design is never valid if it fails the load test. Structural design is often characteri' +
          'zed by trade-offs between material cost, fabrication cost, and construction cost. When a structure i' +
          's designed to minimize material cost, the design will often include many different member types and ' +
          'sizes. But a variety of member sizes makes it harder (and therefore more expensive) to cut and fit t' +
          'he members (fabrication) and to actually assemble them on a job site (construction). Structural desi' +
          'gners usually attempt to achieve a degree of standardization in their selection of structural elemen' +
          'ts, even if that means over-designing some of them. The resulting increase in material cost is usual' +
          'ly offset by savings in fabrication and construction costs. The Bridge Designer cost calculation sim' +
          'ulates this trade-off with reasonable authenticity. In modern structural engineering practice, struc' +
          'tural analysis is generally performed using a computer -based method called matrix structural analys' +
          'is --more specifically the Direct Stiffness Method . Bridge Designer uses this same method to comput' +
          `e member forces during the load test. That's the good news! But it is also important for you to reco` +
          'gnize the bad news-- what is not realistic about BD.'
  },
  {
    id: 'hlp_record_design',
    title: 'Record your design',
    text: 'How to design a bridge Go back one step Once you have completed your design, you should record it to' +
          ' document your efforts and use as a reference for future designs. To record your final design, you c' +
          'an: Save your design as a bridge design file . Print a drawing of your design. Print the load test r' +
          `esults. Notes and tips Don't wait until your design is complete to save it as a bridge design file. ` +
          'Save early and save often, just in case....'
  },
  {
    id: 'hlp_redo',
    title: 'Redo button',
    text: 'Click the Redo button to restore a change to your structural model that was mistakenly undone. Notes' +
          ' and tips The Redo button is located on the Main Toolbar. It can also be accessed from the Edit menu' +
          '. The Redo button works in conjunction with the Undo button.'
  },
  {
    id: 'hlp_report_cost',
    title: 'Report cost calculations button',
    text: 'Click the Report Cost Calculations button to show how the cost of your current design is calculated.' +
          ' The Cost Calculations Report is shown as a table in a separate window. The report can be printed or' +
          ' copied to the Windows clipboard. Notes and tips The Report Cost Calculations button is located on t' +
          'he Status Toolbar. It can also be accessed from the Report menu. Use the Print button (on the right-' +
          'hand side of the Cost Calculations Report window) to send a copy of the report to your printer. Use ' +
          'the Copy button (on the right-hand side of the Cost Calculations Report window) to copy the report t' +
          'o the Windows clipboard. The data will be in tab-delimited ASCII text format. The data can be pasted' +
          ' directly into a Microsoft Excel spreadsheet or a Microsoft Word document. In Word, some adjustment ' +
          'of your tab settings may be necessary to get the numbers to display correctly.'
  },
  {
    id: 'hlp_report_load_test',
    title: 'Report load test results button',
    text: 'Click the Report Load Test Results button to display detailed numerical results of your most recent ' +
          'load test. The Load Test Results Report is shown as a table in a separate window. The report can be ' +
          'printed or copied to the Windows clipboard. Use these results as the basis for strengthening failed ' +
          'members and optimizing the selection of members in your structural model . Notes and tips The Report' +
          ' Load Test Results button is located on the Status Toolbar. It can also be accessed from the Report ' +
          'menu. The Load Test Results Report includes the following for each member in the structural model: a' +
          'bsolute maximum compression force in the member, in kilonewtons (kN) compressive strength of the mem' +
          'ber, in kN compression status ("OK" or "buckles") absolute maximum tension force in the member, in k' +
          'N tensile strength of the member, in kN tension status ("OK" or "yields") Use the Print button (on t' +
          'he right-hand side of the Load Test Results Report window) to print a copy of the report to your pri' +
          'nter. Use the Copy button (on the right-hand side of the Load Test Results Report window) to copy th' +
          'e report to the Windows clipboard. The data will be in tab-delimited ASCII text format. The data can' +
          ' be pasted directly into a Microsoft Excel spreadsheet or a Microsoft Word document. In Word, some a' +
          'djustment of your tab settings may be necessary to get the numbers to display correctly.'
  },
  {
    id: 'hlp_restrictions',
    title: 'Restrictions on the use of Bridge Designer',
    text: 'The Bridge Designer is intended for educational use only . No warranty of any kind is expressed or i' +
          'mplied by the authors. Use of the software for commercial or construction purposes is prohibited. No' +
          'tes and tips To understand why the Bridge Designer is not good for designing a real bridge, see What' +
          ' is not realistic about BD? To try would be to invite disaster: destruction, injury, and death. If y' +
          'ou need to design a real bridge, you must obtain the services of a registered professional civil eng' +
          'ineer.'
  },
  {
    id: 'hlp_roller_support',
    title: 'Roller support',
    text: 'A roller support, represented by this symbol, prevents a joint in the structural model from moving v' +
          'ertically. The joint is still free to move horizontally, however.'
  },
  {
    id: 'hlp_rulers',
    title: 'Rulers',
    text: 'Horizontal and vertical rulers are displayed on the left and bottom edges of the Drawing Board. The ' +
          'rulers allow you to accurately determine the position of the mouse pointer as you draw or move joint' +
          's in the structural model . Notes and tips The rulers are calibrated in meters. The marks on the rul' +
          'ers show the locations of snap points on the drawing grid . You can switch between the low-resolutio' +
          'n, medium-resolution, and high-resolution drawing grid using the Grid Resolution buttons . The measu' +
          'rement marks on the rulers reflect the current grid resolution setting. You can hide or display the ' +
          'rulers using the View Rulers button. If you hide the rulers, the Drawing Board becomes slightly larg' +
          'er. The scale on the rulers shows the upper and lower limits of the drawing grid, as defined by the ' +
          'Design Specifications . The scale on the horizontal ruler begins at zero and ends at the specified s' +
          'pan length. The scale on the vertical ruler begins at the specified minimum elevation and ends at th' +
          'e specified maximum elevation.'
  },
  {
    id: 'hlp_run_load_test',
    title: 'Load test your design',
    text: 'How to design a bridge Go back one step Go forward one step Once you have a complete, stable structu' +
          'ral model , you must run a simulated load test to ensure that all of the members in your design are ' +
          'strong enough to carry the loads prescribed in Design Specification 5. To load test your design: Cli' +
          'ck the Load Test button . Sit back and watch. The Bridge Designer will perform the load test, displa' +
          'y the load test animation, and update the load test status display. If the animation does not appear' +
          `, you may have a computer that's incompatible with the advanced graphics features of the Cloud Editi` +
          'on. See the Use Old-Style Graphics menu item to switch to basic graphics that virtually all computer' +
          's support. Once the load test is complete, click the Drawing Board button to return to the Drawing B' +
          'oard. Notes and tips When you click the Load Test Mode button, the Bridge Designer will automaticall' +
          'y perform the following actions: Create pin and roller supports at the appropriate locations in your' +
          ' structural model. Calculate the weight of all members, and apply these forces to the structure as l' +
          'oads. Calculate the weight of the concrete bridge deck , asphalt wearing surface , and floor beams (' +
          'see Design Specification 5 for more information), and apply the corresponding loads to the structure' +
          '. Apply the AASHTO H25 truck loading to the structure at multiple positions, representing the moveme' +
          'nt of the truck across the bridge. Check the structural model for stability. If the structural model' +
          ' is unstable, the Bridge Designer will attempt to fix the problem. If it is unsuccessful, it will st' +
          'op the load test, inform you of the problem, provide some suggestions for fixing it, and return you ' +
          'to the Drawing Board. Perform a structural analysis , considering the combined effects of the bridge' +
          ' self-weight and truck loading. For each truck position, calculate the displacement of each joint an' +
          'd the member force for each member in the structural model. For each member, compare the calculated ' +
          'member forces for all truck positions, and determine the absolute maximum tension force and the abso' +
          'lute maximum compression force. These are the critical forces that determine whether or not a given ' +
          'member is safe . Calculate the tensile strength and compressive strength of each member. For each me' +
          'mber, compare the absolute maximum tension force with the tensile strength, and compare the absolute' +
          ' maximum compression force with the compressive strength. If the force exceeds the strength in eithe' +
          'r case, the member is unsafe; if not, the member is safe. Prepare and display the load test animatio' +
          'n. Update the load test status display. To save time, you can run the load test without displaying t' +
          `he load test animation. Use the Load Test Options to switch off the animation. If you don't want the` +
          ' Bridge Designer to attempt to automatically fix an unstable structure, you can use the Load Test Op' +
          'tions to switch off this feature.'
  },
  {
    id: 'hlp_save_as',
    title: 'Save as button',
    text: 'Click the Save As button to save the current design under a new file name. Notes and tips The Save A' +
          's button can only be accessed from the File menu. If you do not want to change the file name associa' +
          'ted with your current design, use the Save File button.'
  },
  {
    id: 'hlp_save_file',
    title: 'Save file button',
    text: 'Click the Save file button to save the current design as a bridge design file . If you have not save' +
          'd the model previously, you will be prompted for a filename, directory, and disk drive. If you have ' +
          'saved your structural model previously, clicking the the Save File button causes your design to be s' +
          'aved under the same filename. Notes and tips The Save File button is located on the Main Toolbar. It' +
          ' can also be accessed from the File menu. If you wish to save your structural model under a new file' +
          'name, use the Save As button.'
  },
  {
    id: 'hlp_save_your_design',
    title: 'Save the current design',
    text: 'At any time during the design process, you can save your current design as a bridge design file . Th' +
          'ere are three different ways to save a design. If you have not previously saved the design: Click th' +
          'e Save File button on the Main Toolbar. Choose the disk drive and folder in which you want to save t' +
          'he file. Enter a file name, then click OK. If you have previously saved the design, and you do not w' +
          'ant to change the file name: Click the Save File button on the Main Toolbar. Your existing bridge de' +
          'sign file will be overwritten with your new design, and the file name will remain the same. If you h' +
          'ave previously saved the design, but you want to change its file name: Click the Save As button in t' +
          'he File menu. Choose the disk drive and folder in which you want to save the file. Enter a new file ' +
          'name, then click OK. Notes and tips The default file extension for bridge design files created in th' +
          'e Bridge Designer is .bdc. If you do not specify a file extension when you enter the file name, the ' +
          '.bdc extension will be added automatically. We strongly recommend that you use the default .bdc exte' +
          'nsion for all bridge design files. Bridge design files created in Bridge Designer cannot be read by ' +
          'earlier versions of the software. You can save your structural model at any time, even if it is inco' +
          'mplete.'
  },
  {
    id: 'hlp_select_all',
    title: 'Select all button',
    text: 'Click the Select All button to select every member in the current structural model . Once the member' +
          's are selected, you can change their member properties simultaneously. Notes and tips The Select All' +
          ' button is located on the Main Toolbar. It can also be accessed from the Edit menu.'
  },
  {
    id: 'hlp_select_project',
    title: 'Select a site configuration and load case',
    text: 'How to design a bridge Go forward one step Every time you start up the Bridge Designer , the Welcome' +
          ' dialog box will offer you the following three options: Select the Create a New Bridge Design option' +
          ', and click OK. The Design Project Setup Wizard will be displayed. First, review the Design Requirem' +
          'ent and familiarize with the project site, as displayed in the Preview window. Click the Next button' +
          ' and enter your Local Contest Code, if you are participating in a local bridge design contest. If yo' +
          'u enter a valid Local Contest Code, the associated site configuration and load case will be automati' +
          'cally set up for you on the Drawing Board . If you do not enter a Local Contest Code, you may choose' +
          ' from 98 available site configurations and four available load cases. Click the Next button again to' +
          ' make these selections. Site Configuration The site configuration consists of: Elevation of the deck' +
          ' above the high water level Choice of standard abutments (simple supports) or arch abutments (arch s' +
          'upports) Height of arch abutments (if used) Choice of a pier or no pier Height of pier (if used) Cho' +
          'ice one or two cable anchorages or no cable anchorages Each of these selections affects the site cos' +
          't , which is displayed near the bottom of the Design Project Setup Wizard, along with the correspond' +
          'ing calculations. Once you have made your selections, click the Next button to select the load case.' +
          ' Load Case The load case consists of: Choice of medium-strength or high-strength concrete for the de' +
          'ck. Choice of two AASHTO H25 truck loads , one in each traffic lane; or one single 660 kN Permit Loa' +
          'ding, laterally centered on the deck. Once you have made your selections, you may click the Finish b' +
          'utton to complete the design project setup and activate the Drawing Board . Notes and tips Once the ' +
          'program is running, the only way to change the site configuration or load case is to start a new des' +
          'ign. Clicking the New design button will display the Design Project Setup Wizard. There are 98 possi' +
          'ble site configurations, consisting of various combinations of deck elevation, support type, and sup' +
          'port height. There are four possible load cases, consisting of combinations of the two available dec' +
          'k materials and two available truck loadings. Overall, then, Bridge Designer offers 392 possible des' +
          'ign projects. Each project represents a different type of support or loading, and each one has a dif' +
          'ferent cost--but all 392 are consistent with the design specifications. The total cost of the bridge' +
          ' equals the site cost plus the truss cost. Each site configuration has a different cost, and the sit' +
          'e cost makes up a substantial portion of the total cost of the bridge. But picking the configuration' +
          ' with the lowest site cost will not necessarily result in the lowest total cost. In general, site co' +
          'nfigurations that have a low site cost tend to have a relatively high truss cost and vice versa. A s' +
          'ite configuration with a high deck elevation will generally have a relatively low site cost, because' +
          ' a higher deck requires little or no excavation. But a configuration with a high deck elevation also' +
          ' has a greater span length. A longer span requires a larger, heavier truss, which results in a highe' +
          'r truss cost. Arch abutments cost more than standard abutments , and tall arch abutments cost more t' +
          'han short ones. Thus site configurations that use arches tend to have higher site cost. But because ' +
          'of the V-shape of the river valley, arch abutments also reduce the span length (for a given deck hei' +
          'ght)--the taller the abutment , the shorter the span. Arch abutments also provide more lateral restr' +
          'aint than standard abutments. Both of these factors tend to cause the truss cost to be less for arch' +
          'es. Building a pier in the middle of a river can be quite expensive. Thus configurations with piers ' +
          'have significantly higher site costs than those without piers. But the pier also divides one long sp' +
          'an into two short ones, and two short trusses are usually much less expensive than a single long one' +
          '. Cable anchorages are also expensive, but they provide for additional support (e.g., the cable supp' +
          'orts of a cable-stayed bridge) and thus can reduce the truss cost significantly. The choice of deck ' +
          'material affects both the site cost and the loads applied during the Load Test . Medium-strength con' +
          'crete is less expensive than high-strength concrete but results in a thicker deck, which is heavier.' +
          ' High-strength concrete is more expensive but results in a thinner deck, which is lighter. Thus the ' +
          'less expensive deck material tends to result in a higher truss cost, while the more expensive deck m' +
          'aterial results in a lower truss cost. Your choice of truck loading has no effect on the site cost b' +
          'ut will have a significant effect on the truss cost. Engineering design always involves tradeoffs , ' +
          'and the tradeoff between the cost of a structure and the cost of its supporting substructure is a cr' +
          'itically important aspect of most real-world bridge designs. So which site configuration and load ca' +
          `se will result in the lowest total cost? For now, don't worry about it. Just take your best guess an` +
          `d move on to the next step in the design process. We'll try to find the optimum site configuration l` +
          'ater in the process.'
  },
  {
    id: 'hlp_select_tool',
    title: 'Select tool',
    text: 'Use the Select tool to edit your structural model . When you need to move a joint, delete a joint, c' +
          `hange member properties, or delete a member, you'll need to select the joint or member first by clic` +
          'king on it with the Select tool. Notes and tips The Select tool is located on the Design Tools palet' +
          'te. It can also be accessed from the Tools menu. When the Select tool is in use, the mouse pointer a' +
          'ppears as an arrow . When you move the Select tool over the Drawing Board, joints and members are hi' +
          'ghlighted to indicate that the mouse pointer is close enough to select them.'
  },
  {
    id: 'hlp_setup_wizard',
    title: 'Setup wizard',
    text: 'The project setup wizard is automatically displayed every time you start up the Bridge Designer and ' +
          'choose to create a new design. To display the wizard at any time, click the new design button. The p' +
          'roject setup wizard will erase the drawing board, then set it up for a new design. It will prompt yo' +
          'u to: Read and understand the design requirement . Enter a local contest code . This is optional. Yo' +
          `u can skip it unless you're participating in a local bridge design contest. Select the deck elevatio` +
          'n and support configuration of the bridge. Select the deck material and truck loading to be used for' +
          ` you design. Optinally select a standard truss template to guide your design. Enter the designer's n` +
          'ame and a project identification name or number into the title block. For each step of the site desi' +
          'gn, click the Next button to advance. Click the Back button to return to a previous page and change ' +
          'your selections. Click the Finish button to accept all of your selections and return to the drawing ' +
          'board. Click the Cancel button to reject all of your selections and return to the drawing board. Whe' +
          'n you click the Finish button, the wizard will automatically create the joints that support the brid' +
          'ge deck. See design specification 3.g for more information. It will also create any additional suppo' +
          `rts for the site configuration you've selected. Notes and tips The deck elevation, support configura` +
          'tion, and deck material you choose will determine the site cost of your project. The cost is display' +
          'ed at the bottom of the setup wizard and is automatically updated with each change of deck elevation' +
          ' or support configuration. To see details showing how the site cost is calculated, click the down ar' +
          `row near the lower right-hand corner of the project setup wizard. Once you've selected the deck elev` +
          'ation and support configuration, you can click Finish button at any time. The rest of the setup is o' +
          'ptional.'
  },
  {
    id: 'hlp_show_animation',
    title: 'Show animation check box',
    text: 'Checking the menu entry Tools , Show animation causes a 3D load test animation to be shown immediate' +
          'ly after every load test. Uncheck the box to continue drafting immediately after each load test. Not' +
          'es and tips Disabling the animation allows quicker design iterations.'
  },
  {
    id: 'hlp_slenderness',
    title: 'Slenderness check',
    text: 'Very slender members are difficult to handle on a construction site. They tend to be inadvertently b' +
          'ent or buckled during fabrication. The slenderness check is an evaluation to reduce the likelihood t' +
          'hat this sort of accidental damage will occur. The slenderness check performed by the Bridge Designe' +
          'r is based on the American Institute of Steel Construction design code. A member passes the slendern' +
          'ess check if its slenderness ratio , L / r , meets the following condition: L / r < 300 where L is t' +
          'he length of the member r is the radius of gyration of the member cross-section The radius of gyrati' +
          'on, r , can be calculated as where I is the moment of inertia of the member A is the cross-sectional' +
          ' area of the member If a member fails the Slenderness Check, it is considered to be unserviceable . ' +
          'Notes and tips In the Bridge Designer , the slenderness check is performed automatically as you draw' +
          ' a new member or change the cross-section properties of an existing member. If a member fails the sl' +
          'enderness check (i.e., if L / r is greater than 300), then that member is highlighted in magenta . I' +
          'f one or more members fail the slenderness check, then the Bridge Designer will not perform the Load' +
          ' Test. To fix a member that fails the slenderness check, decrease its length or increase its member ' +
          'size . For a given member size, hollow tubes have lower L / r than solid bars; thus, a solid bar tha' +
          't fails the slenderness check might also be fixed by changing it to a hollow tube. To see the maximu' +
          'm length that a member of a given cross-section and member size can be without failing the slenderne' +
          'ss check, click the Report Member Properties button. The maximum length is indicated by a vertical l' +
          'ine that is colored magenta . To obtain the numerical values of A and I for a given cross-section an' +
          'd member size, click the Report Member Properties button .'
  },
  {
    id: 'hlp_standard_truss',
    title: 'Standard truss configurations',
    text: 'When a truss bridge has its deck located at the top chord, it is called a deck truss . When a truss ' +
          'bridge has its deck located at the bottom chord, it is called a through truss . A number of standard' +
          ' truss configurations are commonly used in bridge structures. These configurations are defined prima' +
          'rily by the geometry of their vertical and diagonal members . Three of the most common standard conf' +
          'igurations are pictured below. All of them are named for the 19th century engineers who developed th' +
          'em. Howe Truss Howe Through Truss Howe Deck Truss Pratt Truss Pratt Through Truss Pratt Deck Truss W' +
          'arren Truss Warren Through Truss Warren Deck Truss Regardless of their configuration, all trusses ha' +
          've the same basic component parts.'
  },
  {
    id: 'hlp_start_new_design',
    title: 'Start a new bridge design',
    text: 'To start a new bridge design: Click the New design button on the Main Toolbar. The Design Project Se' +
          'tup Wizard will be displayed. Review the Design Requirement and click the Next button. If you are pa' +
          'rticipating in a local bridge design contest, enter the Local Contest Code , and click the Next butt' +
          'on. If you did enter a Local Contest Code in the previous step, the site configuration is automatica' +
          'lly selected for you. If not, choose the site configuration you would like to use, and click the Nex' +
          't button. Choose the deck material (which determines the deck thickness and, hence, the deck weight)' +
          ' and load configuration that your design will be based on. If you want to use a template , choose on' +
          'e, and click Next. Enter you name and project ID into the Title Block. Click the Finish button. Note' +
          's and tips Once you have chosen a site configuration, deck material, and load configuration, you can' +
          ' click the Finish button and return to the Drawing Board immediately. Selecting a template and filli' +
          'ng in the Title Block are optional. As you make selections for the deck height, support configuratio' +
          'n, and deck material of your bridge, the corresponding site cost is automatically calculated and dis' +
          'played near the bottom of the Design Project Setup Wizard. To see the the detailed cost calculations' +
          ', click the down arrow to the right of the site cost display. When you click the Finish button, the ' +
          'Site Design Wizard will automatically create a series of joints at the level of the bridge deck, to ' +
          'satisfy the requirements of Design Specification 3.g . The abutments , deck, wearing surface , and w' +
          'ater level will be displayed on the Drawing Board. Arch supports and piers will also be created auto' +
          'matically, if they are included in the substructure configuration you have selected. If your current' +
          ' design has not been saved, you will be prompted to save it before you start a new design.'
  },
  {
    id: 'hlp_strengthen_failed',
    title: 'Strengthen all unsafe members',
    text: 'How to design a bridge Go back one step Go forward one step Your design is successful only if all of' +
          ' the members in your structural model are determined to be safe in the most recent load test . Thus,' +
          ' after each load test, you must strengthen any members that are found to be unsafe . To determine if' +
          ' any members in your structural model are unsafe, use either of the following two methods: After the' +
          ' load test is complete, return to the Drawing Board and look at the picture of your structural model' +
          '. Any member that is highlighted in red is unsafe in compression . Any member that is highlighted in' +
          ' blue is unsafe in tension . If no members are highlighted, there are no unsafe members in your stru' +
          'ctural model. View the two Load Test Results columns on the right side of the Member List. Any membe' +
          'r highlighted in red is unsafe in compression, and any member highlighted in blue is unsafe in tensi' +
          'on. To strengthen an unsafe member, use either of the following two methods: Increase the member siz' +
          'e . Choose the next larger member size, then run the load test again to see if the larger member is ' +
          'strong enough. Repeat the process until the member passes the load test. Use a stronger material. If' +
          ' the unsafe member is carbon steel, try changing it to high-strength steel; if it is high-strength s' +
          'teel, try quenched and tempered steel. Then run the load test again to see if the increased strength' +
          ' of the new material is sufficient. To use either method, you will need to change the properties of ' +
          'a member. Notes and tips Of the two alternative methods, the better solution is the one that produce' +
          's the required increase in strength with less increase in cost. Generally, increasing member size is' +
          ' the more effective method, because there are far more available member sizes than there are materia' +
          'ls. If a member is unsafe in compression, using a stronger material may produce little or no increas' +
          'e in strength. For relatively slender members, the compressive strength is not dependent on the yiel' +
          'd stress of the material. When you change the properties of an unsafe member (for example, by making' +
          ' it larger), the red or blue highlighting will disappear. This does not necessarily mean that the me' +
          'mber is safe. To determine the true status of a member that has been modified, you must run the load' +
          ' test again.'
  },
  {
    id: 'hlp_structural_stability',
    title: 'Structural stability',
    text: 'A truss is stable if all of its members are interconnected as a rigid framework. Stability is usuall' +
          'y achieved by ensuring that the truss is composed of interconnected triangles. For example, the simp' +
          'le truss below is composed of 6 joints and 9 members, which together form four interconnected triang' +
          'les ( ABF , BCF , CEF , and CDE ). If member CF is removed, however, the truss becomes unstable. Wit' +
          'hout its diagonal member, the center panel of the truss now consists of a rectangle ( BCEF ) formed ' +
          'by four members, rather than two triangles ( BCF and CEF ). This configuration is unstable because t' +
          'here is nothing to prevent the rectangle BCEF from distorting into a parallelogram, as shown below: ' +
          'The triangular arrangement of members ensures that the truss structure is a rigid framework. To fix ' +
          'an unstable truss, look for any "panel" of the structural model that is not a triangle, then add one' +
          ' or more members to transform that panel into a series of interconnected triangular shapes. Notes an' +
          'd tips If you are having trouble creating a stable structural model, try loading a template and usin' +
          'g it as a guide for drawing joints and members. If an actual structure is unstable, it will collapse' +
          '. If a structural model is unstable, the structural analysis is mathematically impossible. (The comp' +
          'uter will attempt to divide by zero.) If your structural model is unstable, the Bridge Designer will' +
          ' detect and attempt to fix the instability during the Load Test . If the attempted fix is unsuccessf' +
          'ul, Bridge Designer will display a warning message, and you will have to return to the Drawing Board' +
          ' and modify your structural model to eliminate the instability. Though most trusses are composed of ' +
          'interconnected triangles, it is possible to have one or more non-triangular panels in a stable truss' +
          '. This is particularly true for complex truss configurations and for trusses with arch supports . In' +
          ` such cases, you probably won't be able to tell whether or not the truss is stable just by looking a` +
          't it. The ultimate test for stability is to run the Load Test. If the Load Test runs without display' +
          'ing the "your structural model is unstable" warning, then your truss is stable.'
  },
  {
    id: 'hlp_tensile_strength',
    title: 'Tensile strength',
    text: 'The tensile strength of a member is the internal member force at which a member becomes unsafe in te' +
          'nsion . If the actual member force exceeds the tensile strength, then the member may fail. In the Br' +
          'idge Designer , tensile strength is based on the yielding failure mode. Tensile strength is represen' +
          'ted by the symbol and is measured in units of force, such as kilonewtons (kN). Tensile strength can ' +
          'be calculated using the following equation: where f = 0.95 is the resistance factor for a member in ' +
          'tension Fy is the yield stress A is the cross-sectional area of the member Notes and tips This equat' +
          'ion is taken from the 1994 AASHTO LRFD Bridge Design Specifications. To obtain the numerical value o' +
          'f Fy for a given material, and A for a given cross-section and member size , click the Report Member' +
          ' Properties button. The Bridge Designer calculates the tensile strength of each member in your struc' +
          'tural model during the Load Test. The tensile strength of a member is always greater than its compre' +
          'ssive strength. If the member is relatively long and slender, the difference can be quite substantia' +
          'l.'
  },
  {
    id: 'hlp_the_engineering',
    title: 'The engineering design process',
    text: 'The engineering design process is the application of math, science, and technology to create a syste' +
          'm, component, or process that meets a human need. In practice, engineering design is really just a s' +
          'pecialized form of problem solving . Consider the simple 7-step problem-solving process below: Ident' +
          'ify the problem Define the problem Develop alternative solutions Analyze and compare alternative sol' +
          'utions Select the best alternative Implement the solution Evaluate the results When civil engineers ' +
          'design a bridge, they typically use this same process: Identify the problem. A client hires a team o' +
          'f engineers to design a highway bridge that will cross a river. Define the problem. The engineers in' +
          'vestigate the proposed site and work with the client to determine exactly what the functional requir' +
          'ements of the bridge will be. Where will the bridge be located? How many lanes of traffic are requir' +
          'ed? What are the characteristics of the river--width, depth, current velocity? Is the river used by ' +
          'ships? If so, how wide a navigable channel and how much overhead clearance do the vessels need? Who ' +
          'owns the land on either side of the river? What sort of soil and rock are located there? The enginee' +
          'rs also determine if there are any aesthetic requirements for the structure and, perhaps most import' +
          'antly, they find out how much money the client is willing to pay for the new bridge--the project bud' +
          'get. Develop alternative solutions. The engineers develop several alternative concept designs for th' +
          'e new bridge--perhaps a truss, an arch, and a suspension bridge. Analyze and compare alternative sol' +
          'utions. The engineers analyze each design alternative to determine its strengths and weaknesses, wit' +
          'h respect to the project requirements and constraints identified in Step 2 above. They also consider' +
          ' the environmental impact and constructibility of each proposed option. Select the best alternative.' +
          ' After carefully analyzing all of the alternatives, the engineers select the one that best satisfies' +
          ' the project requirements. They present this selection as a recommendation to the client, who makes ' +
          'the final decision. Implement the solution. Once the client has approved the concept design, the tea' +
          'm completes the final design, prepares plans and specifications, and hands them over to a constructi' +
          'on contractor to build. Evaluate the results. At the end of the project, the engineers evaluate the ' +
          'completed structure. They identify aspects of the project that went well and aspects that could be i' +
          'mproved. Ultimately these observations help to improve the quality of future projects. When you desi' +
          'gn a bridge with the Bridge Designer , you should also follow this same process. Identify the proble' +
          'm. Your project is to design a truss bridge to carry a four-lane highway across a river. Define the ' +
          'problem. To fully define and understand the problem, you should carefully read the Design Specificat' +
          'ions and familiarize with the characteristics of the project site. Develop alternative solutions. To' +
          ' achieve a high-quality design, you will need to investigate several different site configurations a' +
          'nd truss configurations . Analyze and compare alternative solutions. Optimize each alternative confi' +
          'guration for minimum cost, then compare the results. Select the best alternative. Select the alterna' +
          'tive that costs the least, while still passing the load test . Implement the solution. Finalize your' +
          ' design, and record it by saving it to disk, printing a drawing of it, and printing a copy of the lo' +
          'ad test results. If you would like to build and test a cardboard model of your design, check out our' +
          ' Learning Activities Manual, now available for free from our website, http://bridgecontest.org/resou' +
          'rces/file-folder-bridges . Evaluate the results. Think about what you learned about the design proce' +
          'ss and about structural behavior as you designed your bridge. Then apply these lessons to improve th' +
          'e efficiency and effectiveness of your next design. Notes and tips For a description of the specific' +
          ' procedures you should use to design a bridge with the Bridge Designer , see How to Design a Bridge.'
  },
  {
    id: 'hlp_through_truss',
    title: 'The engineering design process',
    text: 'Through Truss A through truss is one with its deck located at the level of the bottom chord. Vehicle' +
          's crossing a through truss bridge are supported between its two main trusses.'
  },
  {
    id: 'hlp_tip_of',
    title: 'Tip of the day',
    text: 'The Tip of the Day dialog box provides hints that will help you learn to use the Bridge Designer mor' +
          `e efficiently, to use some of the program's advanced features, and to optimize your designs more eff` +
          'ectively. The Tip of the Day is automatically displayed every time you start up the program. You can' +
          ' also view it by clicking the Help menu, then selecting Tip of the Day. Notes and tips If you do not' +
          ' want to see the Tip of the Day dialog box every time you start up the program, uncheck the "show ti' +
          'ps at startup" box . To resume displaying the tip of the day at startup, click the help menu, then c' +
          'lick tip of the day. Finally, check the "show tips at startup" box.'
  },
  {
    id: 'hlp_title_bar',
    title: 'Title bar',
    text: 'The title bar is the rectangular area at the top of the bridge design window. It displays the words ' +
          '"Bridge Designer," followed by the name of your current bridge design file . Notes and tips If the B' +
          'ridge Design Window is not maximized, you can move it around your screen by clicking anywhere in the' +
          ' Title Bar and dragging the window to the desired location.'
  },
  {
    id: 'hlp_titleblock',
    title: 'Title block',
    text: 'The Title block is located in the lower right-hand corner of the Drawing Board. It shows the name of' +
          ' the bridge design project, the name of the designer, and a project identification (or project ID). ' +
          'The name of the designer is optional. If you provide it, it will be shown in the title block and inc' +
          'luded on all printed output. Notes and tips The project ID consists of two parts, separated by a das' +
          'h. The first part is the six-character Local Contest Code (if you entered a Local Contest Code when ' +
          'you started your design). This part of the project ID cannot be changed. The second part is optional' +
          ' and can be any name or number that helps you identify your design. When you start a new design, the' +
          ` Design Project Setup Wizard will prompt you for the designer's name and a project ID. If you want t` +
          `o enter or change the designer's name or the project ID after you have begun your design, just click` +
          ' the appropriate box in the Title Block. When the cursor appears, type or edit the desired text. You' +
          ' can hide or display the Title Block using the View Title Block button. When the Member List is disp' +
          'layed, it may hide all or part of the Title Block.'
  },
  {
    id: 'hlp_toolbars',
    title: 'Toolbars',
    text: 'The Bridge Design Window includes four toolbars--normally grouped into two rows just below the Menu ' +
          'Bar --and one free-floating tool palette. Together, they include all of the controls you need to cre' +
          'ate, test, optimize, and record a bridge design. The toolbars and their corresponding controls are p' +
          'ictured and described below. Main Toolbar New design button Open file button Save file button Print ' +
          'button Drawing board button Load test button Select all button Delete button Undo button Redo button' +
          ' Go back button Go forward button Go to iteration button Status Toolbar Current cost Report cost cal' +
          'culations button Current load test status Report load test results button Member Properties Toolbar ' +
          'Member properties lists Increase member Size button Decrease member Size button Report member proper' +
          'ties button Display Toolbar View member list button View rulers button View title block button View ' +
          'member numbers button View symmetry guides button View template button Grid resolution buttons Palet' +
          'tes Design tools Animation controls'
  },
  {
    id: 'hlp_truss_bridges',
    title: 'Trusses and truss bridges',
    text: 'What is a truss? A truss is an arrangement of structural members that are connected together to form' +
          ' a rigid framework. In most trusses, members are arranged in interconnected triangles, as shown in t' +
          'he example below: As a result of this configuration, truss members carry load primarily in axial ten' +
          'sion and compression . Because they are very rigid and they carry load efficiently, trusses are able' +
          ' to span large distances with a minimum of material. Truss Bridges Trusses have been used extensivel' +
          'y in bridges since the early 19th Century. Early truss bridges were made of wood. The classic Americ' +
          'an covered bridges are all trusses, though the wooden truss members are covered by walls and a roof,' +
          ' for protection from the elements. Later truss bridges were made of cast iron and wrought iron. Most' +
          ' modern trusses are made of structural steel. Truss bridges can be found in many different configura' +
          'tions, but virtually all have the same basic component parts. There are many other types of bridges.' +
          ' These include beam bridges, arches, suspension bridges, and cable-stayed bridges.'
  },
  {
    id: 'hlp_truss_configuration',
    title: 'Decide on a truss configuration',
    text: 'How to design a bridge Go back one step Go forward one step Once you have selected a site configurat' +
          'ion, you must decide on the overall configuration of your truss bridge. The Bridge Designer allows y' +
          'ou to use any truss configuration, as long as the structural model you create is stable . Notes and ' +
          'tips Developing a stable structural model can be tricky. We highly recommend that new and inexperien' +
          'ced users start with a standard truss configuration. If you decide to use a standard truss configura' +
          'tion, you can load and display a template to help you correctly draw the joints and members .'
  },
  {
    id: 'hlp_try_new_configuration',
    title: 'Find the optimum truss configuration',
    text: 'How to design a bridge Go back one step Go forward one step Design is inherently an iterative proces' +
          's. To achieve a truly optimal design, you will probably need to try many different truss configurati' +
          'ons. As you might guess, however, there are millions of possible configurations, and you probably wo' +
          `n't have time to try them all! How can you find the optimum, without modeling and testing every poss` +
          'ible truss configuration? One approach is to consider alternative configurations in a very systemati' +
          'c way. Select a configuration, optimize its member properties , and carefully observe how changes in' +
          ' the configuration affected the cost of your design. Keep track of which changes produce reductions ' +
          'in cost and which do not. Then use these observations to guide the selection of your next alternativ' +
          'e configuration. To find the optimum truss configuration: Try a different deck location. If your fir' +
          'st design was a deck truss , try the corresponding through truss configuration, and vice versa. Try ' +
          'a different standard truss configuration. For example, if your first design was a Pratt truss, try a' +
          ' Howe or Warren configuration. Try reducing the length of the compression members in the truss. The ' +
          'compressive strength of a member is a function of its length. As a member gets longer, its compressi' +
          've strength decreases substantially--it has much less resistance to buckling . For this reason, the ' +
          'cost of a truss design can sometimes be reduced by shortening one or more compression members. For e' +
          `xample, let's start with a standard Warren Through Truss: Because the top chords of a simple-span tr` +
          'uss bridge are always in compression, we might be able to reduce the cost of the Warren truss by sub' +
          'dividing its top chord members, like this: Now consider a standard Pratt Through Truss: In this conf' +
          'iguration, the top chords and the verticals are normally in compression. Thus, we could subdivide bo' +
          'th the top chords and the verticals, like this: Note that, in both examples, the length of each comp' +
          'ression member is reduced by half. This reduction in length will usually allow the designer to use a' +
          ' substantially smaller member size to achieve the required compressive strength. Note also that, whe' +
          'n you subdivide a member, you will always need to add additional joints and members to maintain the ' +
          'stability of the truss. To be stable, a truss generally must be made up of a series of interconnecte' +
          'd triangles. To subdivide a compression member in the Bridge Designer , you must: delete the compres' +
          'sion member you want to subdivide, add a new joint at or near the midpoint of the member you just de' +
          'leted, add two new members to replace the original member, add additional members to ensure stabilit' +
          'y, and optimize the member properties of all new members. Reducing the length of compression members' +
          ' may or may not reduce the total cost of your design, depending on whether the cost saving from usin' +
          'g smaller member sizes is enough to offset the increased cost of the additional joints and members. ' +
          'Try reducing the number of joints. The cost of your design includes a fixed cost per joint. Thus you' +
          ' may be able to reduce the total cost by reducing the number of joints in your structural model . Fo' +
          'r example, consider the standard Howe Deck Truss: This configuration can be improved by simply remov' +
          'ing the joint at the midpoint of the bottom chord, like this: When you delete this joint, all three ' +
          'attached members will be deleted as well. You will need to add a single new member to replace the tw' +
          'o bottom chord members you deleted. This modification is often effective for tension members (like t' +
          'he bottom chord members in the example above), because tensile strength is not a function of length.' +
          ' However, removing a joint from the top chord of a truss, as shown below, is less likely to be effec' +
          'tive. By deleting a top chord joint and replacing two chord members with one, you would double the l' +
          'ength of a compression member, making it much weaker. You would need to use a substantially larger m' +
          'ember size to make this member strong enough to pass the load test . Thus any benefit from the reduc' +
          'ed number of joints would probably be lost. Try inventing your own truss configuration, or copy the ' +
          'configuration of an actual bridge. Here are some examples of actual bridge configurations you might ' +
          'consider: Recognize that each of these through trusses could also be designed as a deck truss .'
  },
  {
    id: 'hlp_undo',
    title: 'Undo button',
    text: 'Click the Undo button to undo the most recent change to your structural model . Notes and tips The U' +
          'ndo button is located on the Main Toolbar. It can also be accessed from the Edit menu. The Undo butt' +
          'on works in conjunction with the Redo button.'
  },
  {
    id: 'hlp_undo_vs_go_back',
    title: `What's the difference between undo and go back?`,
    text: 'At first glance, the Go back button and the Undo button might appear to be performing the same funct' +
          'ion. In practice, the two functions are closely related, but there are important distinctions betwee' +
          'n the two: Use Undo to correct any mistakes you make while working on the current design iteration. ' +
          'Use Go Back to revert to a previous design iteration. The Go Back function is normally used as part ' +
          'of the optimization process, rather than to correct drawing or editing errors. Undo is only availabl' +
          'e for the 100 most recent changes to your structural model , but you can Go Back to any previous des' +
          'ign iteration created during the current session . Because Undo only applies to the current design i' +
          'teration, the Undo function is disabled whenever you Go Back to a previous iteration. Undo is enable' +
          'd again as soon as you make any new changes to the structural model.'
  },
  {
    id: 'hlp_using_undo',
    title: 'Using undo and redo',
    text: 'Anytime you make a mistake while creating or editing your structural model , you can click the Undo ' +
          'button to undo the error. If you mistakenly undo a change to your structural model, you can restore ' +
          'it using the Redo button. Notes and tips The following actions can be undone: draw a joint draw a me' +
          'mber move a joint change the properties of a member delete or erase a joint delete or erase a member' +
          ' Any action that can be undone can also be restored using redo. The Bridge Designer allows 100 level' +
          's of undo. That is, you can undo the 100 most recent changes to your structural model. You can only ' +
          'undo changes made during the current design iteration. To revert to a previous design iteration, use' +
          ` the go back button. For a more detailed explanation, see what's the difference between go back and ` +
          'undo?'
  },
  {
    id: 'hlp_view_animation_controls',
    title: 'View animation controls button',
    text: 'Click the View Animation Controls button in the View menu to display or hide the Animation Controls ' +
          '. This button functions as a "toggle." If the Animation Controls is currently visible, clicking the ' +
          'button will hide it. If the controls are hidden, clicking the button will display them. Notes and ti' +
          `ps You won't be able to show the Animation Controls while the Drawing Board is in use.`
  },
  {
    id: 'hlp_view_member_list',
    title: 'View member list button',
    text: 'Click the View Member List button to display or hide the Member List. This button functions as a "to' +
          'ggle." If the Member List is currently visible, clicking the button will hide it. If the Member List' +
          ' is hidden, clicking the button will display it. Notes and tips The View Member List button is locat' +
          'ed on the Display Toolbar. It can also be accessed from the View menu. The Member List can also be h' +
          'idden from view by dragging it to the right-hand edge of the Drawing Board.'
  },
  {
    id: 'hlp_view_member_numbers',
    title: 'View member numbers button',
    text: 'Click the View Member Numbers button to display or hide the member numbers on the Drawing Board . Th' +
          'is button functions as a "toggle." If the member numbers are currently visible, clicking the button ' +
          'will hide them. If the member numbers are hidden, clicking the button will display them. Notes and t' +
          'ips The View Member Numbers button is located on the Display Toolbar. It can also be accessed from t' +
          'he View menu.'
  },
  {
    id: 'hlp_view_rulers',
    title: 'View rulers button',
    text: 'Click the View Rulers button to display or hide the rulers. This button functions as a "toggle." If ' +
          'the rulers are currently visible, clicking the button will hide them. If the rulers are hidden, clic' +
          'king the button will display them. Notes and tips The View Rulers button is located on the Display T' +
          'oolbar. It can also be accessed from the View menu. If you hide the rulers, the Drawing Board become' +
          's slightly larger.'
  },
  {
    id: 'hlp_view_symmetry',
    title: 'View symmetry guides button',
    text: 'Click the View Symmetry Guides button to display or hide a set of two vertical and one horizontal gu' +
          'ide lines on the Drawing Board. Use these guides when drawing or moving joints , to ensure that your' +
          ' structural model is symmetrical . The guides can be moved by dragging handles located at the left s' +
          'ide of the horizontal guide and at the bottom of one vertical guide. If the horizontal and left-hand' +
          ' vertical guides are positioned so that they intersect over a particular joint, then the intersectio' +
          'n of the horizontal and right-hand vertical guides marks the location of a symmetrical joint on the ' +
          'opposite side of the truss. The View Symmetry Guides button functions as a "toggle." If the guides a' +
          're visible, clicking the button will hide them. If the guides are hidden, clicking the button will d' +
          'isplay them. Notes and tips The View Symmetry Guides button is located on the Display Toolbar. It ca' +
          'n also be accessed from the View menu. The View Symmetry Guides button is only available when the Jo' +
          'int tool or the Select tool is active. Several site configurations have a pier that is not located a' +
          'long the centerline of the bridge In these cases, an optimal structural design is not likely to be s' +
          'ymmetrical.'
  },
  {
    id: 'hlp_view_template',
    title: 'View template button',
    text: 'Click the View template button to display or hide the current template on the Drawing Board. This bu' +
          'tton functions as a "toggle." If the template is visible, clicking the button will hide it. If the t' +
          'emplate is hidden, clicking the button will display it. Notes and tips The View Template button is l' +
          'ocated on the Display Toolbar. It can also be accessed from the View menu. The View Template button ' +
          'is only enabled when a template is loaded. See Load and Display a Template for more information. A t' +
          'emplate is always displayed behind the structural model on the Drawing Board.'
  },
  {
    id: 'hlp_view_title',
    title: 'View title block button',
    text: 'Click the View title block button to display or hide the Title block . This button functions as a "t' +
          'oggle." If the Title Block is currently visible, clicking the button will hide it. If the Title Bloc' +
          'k is hidden, clicking the button will display it. Notes and tips The View Title Block button is loca' +
          'ted on the Display Toolbar . It can also be accessed from the View menu . If your computer has a low' +
          '-resolution monitor, you may find that the Title Block covers up the lower edge of the drawing grid.' +
          ' In this case, you might need to hide the Title Block to create or edit your structural model .'
  },
  {
    id: 'hlp_view_tools',
    title: 'View design tools button',
    text: 'Click the View Design Tools button in the View menu to display or hide the Design Tools Palette . Th' +
          'is button functions as a "toggle." If the Design Tools Palette is currently visible, clicking the bu' +
          'tton will hide it. If the palette is hidden, clicking the button will display it. Notes and tips You' +
          ` won't be able to show the Design Tools Palette while the Load Test Animation is in progress.`
  },
  {
    id: 'hlp_whats_new',
    title: `What's new in the cloud edition?`,
    text: 'Welcome! Welcome to the Cloud Edition of the Bridge Designer ! With millions of users since 2002, th' +
          'e Bridge Designer is one of the most successful educational software technologies in the world. The ' +
          'new edition is an update designed to enable Bridge Designer learning for anyone with access to a web' +
          ' browser. Get started right now with your introductory engineering experience working alone, on a te' +
          'am team, or with a teacher. New Features Please enjoy checking out the new possibilities! Old-style ' +
          'graphics option. Computers lacking the graphics features needed for the Cloud Edition load test walk' +
          '-through can still enjoy animation by selecting old-style graphics, similar to the original. A recap' +
          ' of Cloud Edition features: Macintosh and Linux support. Newer OS X Macintosh computers are excellen' +
          't platforms for the Cloud Edition. Linux support will be provided as future demand indicates. 3D wal' +
          'k-through of completed bridges. Walk and fly under, around, and through the animation of your comple' +
          'ted bridge to observe its performance while the truck load drives over the deck. Member Details. An ' +
          'interactive Member Details explorer supplements the Members List with dynamically updated engineerin' +
          'g information about member cross-sections, materials, lengths, and costs. Unlimited Undo. The limit ' +
          'of 5 is gone! Undo and redo all edits for the current design iteration. Iterations Tree View. Track ' +
          'your design iterations with a new view that graphically shows the history of each one. Enhanced blue' +
          'prints. Print your bridge in a beautiful format suitable for framing. Click and drag member list sel' +
          'ections. Click and drag to select a group of members in the member list. Filename associations. .Dou' +
          'ble-click a file with a bdc file name extension to start the BD and load the file.'
  },
];
