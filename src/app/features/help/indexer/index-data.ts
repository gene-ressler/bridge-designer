type HelpIndexData = {
  id: string,
  title: string,
  text: string,
};

export const HELP_INDEX_DATA: HelpIndexData[] = [
  {
    id: 'glos_aashto',
    title: 'AASHTO',
    text: 'aashto american association state highway transportation officials governing body writes publishes d' +
          'esign codes highway bridges united states'
  },
  {
    id: 'hlp_aashto_h20x44',
    title: 'AASHTO H25 truck loading',
    text: 'aashto h25 loading hypothetical cargo truck similar one pictured truck two axles spaced approximatel' +
          'y 4 meters apart truck total weight 225 kilonewtons kn 44 kn applied front axle 181 kn rear aashto t' +
          'ruck loading used design bridge axle weights generally increased factor called dynamic load allowanc' +
          'e accounts effects moving load structural engineer designs actual bridge must ensure members structu' +
          're safely carry forces generated one aashto truck loading applied every traffic lane bridge deck tru' +
          'ck loading positioned anywhere along length bridge indicated design specifications bridge designer a' +
          'llows design bridge either two highway loading conditions two lanes highway traffic represented one ' +
          'h25 truck lane single 480 kn permit loading centered laterally roadway first load case two traffic l' +
          'anes two main trusses must carry weight one lane thus loading used bridge designer consists one h25 ' +
          'truck total weight 225 kn second case single truck centered roadway two main trusses must carry one ' +
          'half total truck weight thus permit loading used bridge designer consists 240 kn 120 kn applied axle' +
          ' location cases dynamic load allowance 1.33'
  },
  {
    id: 'glos_abutment',
    title: 'Abutment',
    text: 'abutment stone concrete wall supports one end bridge span abutment also acts retaining wall holding ' +
          'back earth embankments approaches bridge abutment part substructure bridge'
  },
  {
    id: 'glos_anchorages',
    title: 'Anchorages',
    text: 'anchorage foundation structure cables suspension bridge connected cables support weight suspension b' +
          'ridge anchorages generally massive often extend far surface earth bridge designer anchorages represe' +
          'nted pinned supports'
  },
  {
    id: 'hlp_animation_controls',
    title: 'Animation controls palette',
    text: 'use tools animation controls palette change aspects load test animation click play button start rest' +
          'art animation click pause button temporarily halt animation click rewind button reset animation star' +
          'ting point load applied bridge move animation speed slider change speed truck vary 0.5 30km per hour' +
          ' press drop button reveal hide additional animation controls additional controls visible check unche' +
          'ck boxes display hide various animation features shadows controls whether sun casts shadows within s' +
          'imulated scene sky controls whether sky drawn using realistic graphic includes clouds sun hills dist' +
          'ance simple blue background terrain controls whether ground water around bridge drawn abutments cont' +
          'rols whether bridge abutments road surfaces drawn colors controls whether member forces depicted col' +
          'ors box checked compression represented red tension blue load moves across bridge deck otherwise fla' +
          't gray used erosion controls whether terrain color adjusted depict soil erosion steep slopes note co' +
          'mputers may properly draw eroded terrain due bugs graphics card drivers terrain strangely colored di' +
          'sappears erosion checked keep control unchecked state exaggeration controls whether member deflectio' +
          'ns exaggerated make visible. unchecked animation realistic checked changes shape truss load multipli' +
          'ed 20 order make visible truck controls whether cartoon truck loading shown hidden options missing m' +
          'odified old style graphics selected notes tips use animation view controls walk bridge site animatio' +
          'n controls palette normally displayed whenever load test design palette automatically hidden return ' +
          'drawing board manually close controls make visible view animation controls menu item initiate load t' +
          'est play button automatically depressed pause must use play button restart smoothness animation depe' +
          'nds speed computers processor graphics system motion looks jerky try turning animation features turn' +
          'ing shadows likely greatest effect'
  },
  {
    id: 'hlp_animation_view_controls',
    title: 'Animation view controls',
    text: 'animation view controls move rotate viewpoint load test animation within scene creating impression f' +
          'lying bridge normally shown faded colors left side animation screen shown pass mouse controls bright' +
          'en full color click drag walk control move forward turn left right scene though walking dragging upw' +
          'ard moves forward dragging downward moves rear click drag slide control move laterally direction tho' +
          'ugh stepping sideways moving elevator within scene click drag head tilt control change view though t' +
          'ilting head left right observing scene example walk bridge span tilt observe structure beneath deck ' +
          'click home control move back position whole bridge visible click drag truck view control see truck d' +
          'river sees drives bridge drag mouse left right see around'
  },
  {
    id: 'glos_arch_abutments',
    title: 'Arch abutments',
    text: 'bridge designer arch abutments substructure elements use arch supports hold bridge transmit weight s' +
          'oil'
  },
  {
    id: 'glos_arch_supports',
    title: 'Arch supports',
    text: 'arch supports consist pin end span arch supports allow lateral movement bridge thus provide restrain' +
          't simple supports'
  },
  {
    id: 'glos_asphalt',
    title: 'Asphalt',
    text: 'asphalt mixture gravel bitumen product petroleum refining process asphalt commonly used pavement wea' +
          'ring surface bridge decks'
  },
  {
    id: 'glos_astm',
    title: 'ASTM',
    text: 'american society testing materials astm profit organization manufacturers consumers researchers gove' +
          'rnment officials write standards production testing use building materials astm standards ensure mat' +
          'erials uniformly understood engineering properties appropriate level quality'
  },
  {
    id: 'hlp_auto_correct_errors',
    title: 'Auto correct errors check box',
    text: 'checking menu entry tools auto correct errors causes bridge designer attempt repairs common minor er' +
          'rors automatically load test notes tips usually best enable auto correction feature cant harm undesi' +
          'red changes makes removed undo analysis complete'
  },
  {
    id: 'glos_bearing',
    title: 'Bearing',
    text: 'bearing another word support supports joints structure attached foundation'
  },
  {
    id: 'glos_bridge_design_file',
    title: 'Bridge design file',
    text: 'bridge design file specially formatted text file created bridge designer save bridge design future u' +
          'se'
  },
  {
    id: 'hlp_bridge_design_window',
    title: 'Bridge design window',
    text: 'bridge design window graphical environment create test optimize record bridge design diagram shows m' +
          'ajor functional components make bridge design window learn component click corresponding area diagra' +
          'm notes tips best keep bridge design window maximized working design reducing window size makes draw' +
          'ing editing structural model difficult'
  },
  {
    id: 'glos_buckling',
    title: 'Buckling',
    text: 'buckling principal failure mode member loaded compression member buckles bends sideways compressed a' +
          'xially failure usually sudden catastrophic members long slender particularly susceptible buckling'
  },
  {
    id: 'glos_cable_anchorages',
    title: 'Cable anchorages',
    text: 'cable anchorage foundation structure cables suspension bridge connected cables support weight suspen' +
          'sion bridge anchorages generally massive often extend far surface earth bridge designer cable anchor' +
          'ages represented pinned supports'
  },
  {
    id: 'hlp_change_member_properties',
    title: 'Change the properties of a member',
    text: 'change properties member structural model click select tool design tools palette select member want ' +
          'modify either clicking member clicking entry member list member turn light blue selected click drop ' +
          'button member properties list property want change material cross section member size select materia' +
          'l cross section member size respective list new property assigned selected member notes tips change ' +
          'properties several members simultaneously use multiple selection choose new material cross section m' +
          'ember size appropriate member properties list increase decrease size selected members next larger sm' +
          'aller one select members want modify click increase member size button decrease member size button u' +
          'se multiple selection either button selected members wont necessarily end size. theyll increase decr' +
          'ease independently want change properties members structural model click select button choose new ma' +
          'terial cross section member size change properties member appearance member change drawing board cha' +
          'nging material cause color displayed member change changing size cause width member change according' +
          'ly changing cross section solid bar hollow tube cause displayed member change single line double lin' +
          'e vice versa'
  },
  {
    id: 'hlp_choose_optimum',
    title: 'Choose the optimum design',
    text: 'design bridge go back one step go forward one step bridge designer optimum design one costs least co' +
          'nsidered many different alternative site truss configurations possible choose one lowest total cost ' +
          'final design notes tips design actual bridge many criteria would taken account selecting desirable a' +
          'lternative include aesthetics ease construction ease maintenance local availability materials enviro' +
          'nmental impact'
  },
  {
    id: 'glos_chords',
    title: 'Chords',
    text: 'chords main horizontal load carrying members truss truss bridge top chords normally carry compressio' +
          'n bottom chords normally carry tension'
  },
  {
    id: 'glos_client',
    title: 'Client',
    text: 'client person organization hires professional like engineer doctor lawyer perform specialized servic' +
          'e'
  },
  {
    id: 'hlp_component_parts',
    title: 'Component parts of a truss bridge',
    text: 'major component parts typical truss bridge chords top bottom verticals also called vertical members ' +
          'diagonals also called diagonal members floor beams deck pinned support also called fixed bearing rol' +
          'ler support also called expansion bearing abutments piers component parts illustrated 3 dimensional ' +
          'view elevation side view notes tips number standard truss configurations commonly used bridge struct' +
          'ures defined primarily geometry vertical diagonal members'
  },
  {
    id: 'glos_compression',
    title: 'Compression',
    text: 'compression internal axial member force tends >>>shorten<<< member'
  },
  {
    id: 'hlp_compressive_strength',
    title: 'Compressive strength',
    text: 'compressive strength member internal force causes become unsafe compression actual member force exce' +
          'eds compressive strength member might fail compressive strength calculations performed bridge design' +
          'er based buckling failure mode compressive strength represented symbol ϕp n measured units force kil' +
          'onewtons abbreviated kn compressive strength calculated using following equations λ ≤ 2.25 ϕp n = ϕ ' +
          '0.66 λ f y λ > 2.25 ϕp n = ϕ 0.88 f y ⁄ λ λ = f y al 2 ⁄ π 2 ei dimensionless parameter differentiat' +
          'es inelastic λ ≤ 2.25 elastic λ > 2.25 buckling failure modes ϕ = 0.90 resistance factor member comp' +
          'ression f y yield stress cross sectional area member π 3.14159.. e modulus elasticity material momen' +
          't inertia member l length member notes tips equations taken 1994 aashto lrfd bridge design specifica' +
          'tions see graph compressive strength function member length see member details tab obtain numerical ' +
          'values f y e given material given cross section member size click member details tab bridge designer' +
          ' calculates compressive strength member structural model load test compressive strength member alway' +
          's less tensile strength member relatively long slender difference quite substantial number 0.88 equa' +
          'tion accounts fact actual structural members never perfectly straight slight crookedness actual stru' +
          'ctural members buckle internal force average 12% lower theory predicts'
  },
  {
    id: 'glos_concrete',
    title: 'Concrete',
    text: 'concrete mixture portland cement sand gravel water concrete hardens forms solid rock like substance ' +
          'used build many kinds structures'
  },
  {
    id: 'glos_connections',
    title: 'Connections',
    text: 'connection assembly steel plates bolts and/or welds attach two members together actual structure con' +
          'nections real structure represented joints structural model'
  },
  {
    id: 'hlp_cost',
    title: 'Cost of the design',
    text: 'bridge designer automatically calculates cost bridge design create cost continuously updated display' +
          'ed status toolbar cost calculated bridge designer accurately represent total cost actual bridge proj' +
          'ect rather intended give general appreciation competing factors influence cost typical engineering p' +
          'roject learning tool total cost bridge design consists two major components site cost truss cost sit' +
          'e cost turn sum three components excavation cost deck cost support cost truss cost also includes thr' +
          'ee components material cost connection cost product cost cost components described specific numerica' +
          'l cost factors listed design specifications site cost site cost consists costs associated selection ' +
          'site configuration deck height span length support configuration bridge excavation cost select deck ' +
          'height determine amount soil must excavated achieve correct highway elevation lower deck excavation ' +
          'required real world construction excavation priced cubic yard cubic meter bridge designer determines' +
          ' required volume soil excavation based selected deck elevation deck cost selection deck height also ' +
          'determines overall span length bridge higher deck results longer span increases truss cost cost rein' +
          'forced concrete deck bridge designer also select material deck made either medium strength high stre' +
          'ngth concrete medium strength concrete costs less high strength concrete lower strength requires dec' +
          'k thicker thicker deck weighs thinner high strength concrete deck thus increase loading truss increa' +
          'sed loading cause truss cost increase result cheaper deck tends require expensive truss vice versa e' +
          'ither case cost deck specified lump sum cost 4 meter deck panel support cost select type abutments p' +
          'iers cable anchorages used bridge bridge designer determines costs associated constructing supports ' +
          'support configuration unique cost given type abutment standard arch cost tends increase span length ' +
          'longer spans weigh shorter spans thus transmit greater loads supports general standard abutments cos' +
          't less arch abutments given span length costs arch abutments piers also vary significantly height hi' +
          'gher abutments piers use material shorter ones cost cable anchorages single lump sum cost truss cost' +
          ' truss cost consists costs associated structural steel members connections make two main trusses pri' +
          'ncipal load carrying elements bridge material cost structural steel normally priced weight mass e.g.' +
          ' dollars per pound dollars per kilogram thus cost structure depends part total weight material used ' +
          'build bridge designer calculates material cost determining total mass three available materials carb' +
          'on steel high strength steel quenched tempered steel structural model multiplying mass material type' +
          ' corresponding unit cost dollars per kilogram adding together get total material cost noted design s' +
          'pecifications three different types steel different unit cost carbon steel least expensive quenched ' +
          'tempered steel expensive given material hollow tubes expensive per kilogram solid bars connection co' +
          'st real structures cost fabricating building connections join members together significant thus brid' +
          'ge designer includes cost per joint part total cost structure actual three dimensional bridge two ma' +
          'in trusses number connections used basis calculation double number joints two dimensional structural' +
          ' model product cost structural design construction economical design often one simply minimizes mate' +
          'rial cost often total cost structure reduced standardizing materials member sizes members structure ' +
          'different materials sizes cost ordering fabricating constructing members relatively high many member' +
          's fabrication construction costs relatively lower reason bridge designer includes cost per product p' +
          'art total cost truss product defined unique combination material cross section member size structura' +
          'l model cost calculations see cost factors cost per kilogram cost per joint cost per product site co' +
          'st actual cost calculations current design click report cost calculations button site design wizard ' +
          'also displays detailed calculations component site cost minimizing total cost attempt minimize total' +
          ' cost bridge design find never minimize site cost material cost connection cost product cost simulta' +
          'neously minimizing total cost always compromise among four competing factors minimize site cost woul' +
          'd simply select site configuration costs least least expensive site configuration requires simply su' +
          'pported truss spanning full 44 meters configuration require relatively heavy truss one high material' +
          ' cost minimize material cost must make member light possibly without failing truss configurations ac' +
          'hieving condition requires use solid bars hollow tubes wide variety different sizes minimizing mater' +
          'ial cost requires use lot different products result product cost quite high minimize connection cost' +
          ' must use smallest possible number joints minimize number joints inevitably long members structural ' +
          'model long member subjected compressive loading require large member size keep failing member gets l' +
          'onger compressive strength decreases significantly. thus minimizing connection cost usually results ' +
          'high material cost minimize product cost would need use single material cross section size every mem' +
          'ber structural model single member size would large enough ensure heavily loaded member structure fa' +
          'il result many members would much stronger therefore much heavier really need material cost would ex' +
          'tremely high clearly tradeoffs among site cost material cost connection cost product cost minimizing' +
          ' one always increases one others task designer find best compromise'
  },
  {
    id: 'hlp_crossxsection',
    title: 'Cross section',
    text: 'cross section shape formed cutting member perpendicular axis cross section solid bar square measurin' +
          'g w side cross section hollow tube open square measuring w side wall thickness cross sectional area ' +
          'member surface area cross section picture light blue shaded region'
  },
  {
    id: 'hlp_deck_truss',
    title: 'Cross section',
    text: 'deck truss deck truss one deck located level top chord. vehicles crossing deck truss bridge supporte' +
          'd trusses'
  },
  {
    id: 'glos_cut',
    title: 'Cut',
    text: 'cut excavation lowers elevation roadway existing surface land'
  },
  {
    id: 'hlp_truss_configuration',
    title: 'Decide on a truss configuration',
    text: 'design bridge go back one step go forward one step selected site configuration must decide overall c' +
          'onfiguration truss bridge bridge designer allows use truss configuration long structural model creat' +
          'e stable notes tips developing stable structural model tricky highly recommend new inexperienced use' +
          'rs start standard truss configuration decide use standard truss configuration load display template ' +
          'help correctly draw joints members'
  },
  {
    id: 'glos_deck',
    title: 'Deck',
    text: 'deck floor bridge directly supports vehicles pedestrians cross bridge bridge decks usually made rein' +
          'forced concrete'
  },
  {
    id: 'glos_deck_truss',
    title: 'Deck truss',
    text: 'deck truss truss deck located top chord. vehicles crossing deck trusses supported trusses'
  },
  {
    id: 'hlp_decrease_member',
    title: 'Decrease member size button',
    text: 'click decrease member size button decrease size currently selected member next smaller notes tips de' +
          'crease member size button located member properties toolbar one member selected clicking button decr' +
          'ease size selected members even different sizes example 50mm member 90mm member 120mm member selecte' +
          'd clicking button change 45mm 80mm 110mm respectively use decrease member size button member size li' +
          'st updated reflect change use decrease member size button two member properties lists material cross' +
          ' section type change'
  },
  {
    id: 'hlp_delete_joint',
    title: 'Delete a joint',
    text: 'delete joint structural model click select tool design tools palette click joint want delete turn li' +
          'ght blue indicate selected click delete button notes tips must working drawing board delete joint de' +
          'lete key keyboard performs function delete button toolbar delete one joint time multiple selection j' +
          'oints allowed delete joint members attached joint also deleted cannot delete joints created automati' +
          'cally bridge designer started design also delete joint structural model erasing accidentally delete ' +
          'joint click undo button restore'
  },
  {
    id: 'hlp_delete_member',
    title: 'Delete a member',
    text: 'delete member structural model click select tool design tools palette select member want delete eith' +
          'er clicking member clicking entry member list member turn light blue indicate selected click delete ' +
          'button delete selected member notes tips must drawing board mode delete member want delete one membe' +
          'r time use multiple selection click delete button delete key keyboard performs function delete butto' +
          'n toolbar delete member members higher member numbers re numbered fill gap also remove member struct' +
          'ural model erasing accidentally delete member click undo button restore'
  },
  {
    id: 'hlp_delete',
    title: 'Delete button',
    text: 'click delete button delete currently selected joint delete currently selected member notes tips dele' +
          'te button located main toolbar also accessed edit menu use delete key keyboard perform exactly funct' +
          'ion delete button also use eraser tool delete joints members'
  },
  {
    id: 'hlp_design_specifications',
    title: 'Design specifications',
    text: 'specifications listed built bridge designer follow design process bridge designer ensure satisfy spe' +
          'cifications listed better understand sorts requirements constraints engineers consider design real b' +
          'ridges problem youre civil engineer working state department transportation assigned responsibility ' +
          'design truss bridge carry two lane highway across river valley shown design objective satisfy specif' +
          'ications listed keeping total cost project low possible bridge configuration bridge may cross valley' +
          ' elevation high water level 24 meters high water level elevation bridge deck 24 meters excavation ri' +
          'ver banks required achieve correct highway elevation amount excavation required deck elevation deter' +
          'mined automatically bridge designer provide clearance overhead power lines shown highest point bridg' +
          'e may exceed elevation 32.5 meters high water level 8.5 meters top river banks bridge substructure m' +
          'ay consist either standard abutments simple supports arch abutments arch supports necessary bridge m' +
          'ay also use one intermediate pier located near center valley necessary bridge may also use cable anc' +
          'horages located 8 meters behind one abutments main truss 100 joints 200 members bridge flat reinforc' +
          'ed concrete deck two types concrete available medium strength concrete requires deck thickness 23 ce' +
          'ntimeters 0.23 meter high strength concrete requires deck thickness 15 centimeters 0.15 meter either' +
          ' case deck supported transverse floor beams spaced 4 meter intervals see component parts truss bridg' +
          'e information terms. accommodate floor beams structural model must row deck support joints spaced 4 ' +
          'meters apart deck level joints created automatically begin new design bridge deck 10 meters wide all' +
          'owing accommodate two lanes traffic member properties materials member truss made carbon steel high ' +
          'strength low alloy steel quenched tempered steel cross sections members truss either solid bars holl' +
          'ow tubes types cross sections square member size cross sections available variety standard sizes loa' +
          'ds bridge must capable safely carrying following loads weight reinforced concrete deck weight 5 cm t' +
          'hick asphalt wearing surface might applied time future weight steel floor beams supplemental bracing' +
          ' members apply 12.0 kn load deck support joint weight main trusses weight either two possible truck ' +
          'loadings one standard h25 truck loading per lane including appropriate allowance dynamic effects mov' +
          'ing load since bridge carries two lanes traffic main truss must safely carry one h25 vehicle placed ' +
          'anywhere along length deck. single 480 kn permit loading including allowance dynamic effects moving ' +
          'load since permit loading assumed centered laterally main truss must safely carry one half total veh' +
          'icle weight placed anywhere along length deck structural safety bridge comply structural safety prov' +
          'isions 1994 lrfd aashto bridge design specification lrfd refers load resistance factor design. inclu' +
          'des material densities load combinations tensile strength members compressive strength members cost ' +
          'cost design calculated using following factors material cost carbon steel bars $4.50 per kilogram ca' +
          'rbon steel tubes $6.30 per kilogram high strength steel bars $5.00 per kilogram high strength steel ' +
          'tubes $7.00 per kilogram quenched tempered steel bars $5.55 per kilogram quenched tempered steel tub' +
          'es $7.75 per kilogram connection cost $500.00 per joint product cost $1000.00 per product site cost ' +
          'reinforced concrete deck medium strength $5 150 per 4 meter panel reinforced concrete deck high stre' +
          'ngth $5 300 per 4 meter panel excavation $1.00 per cubic meter see site design wizard excavation vol' +
          'ume supports abutments pier cost varies see site design wizard specific values cable anchorages $6 0' +
          '00 per anchorage notes tips bridge designer ensures design satisfies design specifications listed dr' +
          'awing board automatically set bridge correct span length height supports bridge designer automatical' +
          'ly calculates loads resulting member forces run load test performs aashto structural safety checks m' +
          'embers structural model strong enough tells ones need strengthened also calculates cost design aasht' +
          'o safety standards simplified considerably bridge designer thats one important reason software educa' +
          'tional use information see realistic bd'
  },
  {
    id: 'hlp_design_tools',
    title: 'Design tools palette',
    text: 'design tools palette free floating toolbar positioned anywhere bridge design window contains followi' +
          'ng tools creating modifying structural model joint tool member tool select tool eraser tool notes ti' +
          'ps move design tools palette new location click drag title bar palette'
  },
  {
    id: 'glos_diagonals',
    title: 'Diagonals',
    text: 'diagonals truss members oriented diagonally usually connect top bottom chords together'
  },
  {
    id: 'glos_displacement',
    title: 'Displacement',
    text: 'displacement movement joint occurs loads applied structure'
  },
  {
    id: 'hlp_draw_joint',
    title: 'Draw joints',
    text: 'design bridge go back one step go forward one step create structural model must first draw joints co' +
          'nnections structural members joined together draw joint select joint tool design tools palette posit' +
          'ion mouse pointer location drawing board want add joint click left mouse button create new joint not' +
          'es tips draw joint must drawing board mode joints placed snap points drawing board joints cannot pla' +
          'ced outside maximum minimum elevation restrictions noted design specifications two joints cannot pla' +
          'ced location accidentally place joint wrong location click undo button remove also delete joint move' +
          ' joint new location start new design series joints created automatically project setup wizard joints' +
          ' support deck cant moved deleted movable joints black outline light grey center immovable joints gre' +
          'y outline white center joints create cannot attached abutments piers words cant create additional su' +
          'pports supports permitted created automatically project setup wizard site configurations high pier j' +
          'oints cannot drawn pier structural model limited 50 joints'
  },
  {
    id: 'hlp_draw_member',
    title: 'Draw members',
    text: 'design bridge go back one step go forward one step drawn joints connect truss draw members make stru' +
          'cture members must drawn joint joint draw member select member tool design tools palette position mo' +
          'use pointer joint highlighted show ready connected click left mouse button hold drag mouse pointer a' +
          'nother joint release button new member created first joint second notes tips draw member must drawin' +
          'g board mode create new member member properties currently displayed member properties lists automat' +
          'ically assigned new member changed later see change properties member information create new members' +
          ' member numbers assigned automatically display member numbers click view member numbers button two m' +
          'embers cannot drawn pair joints attempt draw member crosses one joints ends two members automaticall' +
          'y created theyll properties accidentally draw member wrong location click undo button remove delete ' +
          'member site configurations high pier members cannot drawn intermediate pier structural model 120 mem' +
          'bers'
  },
  {
    id: 'hlp_drawing_board',
    title: 'Drawing board',
    text: 'drawing board portion bridge design window create structural model drawing joints members mouse usin' +
          'g drawing board also edit structural model moving adding deleting joints changing member properties ' +
          'adding deleting members notes tips use drawing board button return drawing board load test bridge ab' +
          'utments floor beams concrete deck asphalt road surface high water level displayed drawing board time' +
          's see component parts truss bridge information terms. size position based site configuration youve s' +
          'elected drawing board covered drawing grid cant see there. draw joints create structural model mouse' +
          ' snaps grid line intersections called snap points joints drawn snap points drawing grid set low medi' +
          'um high resolution use grid resolution buttons switch among three often easiest create structural mo' +
          'del using low resolution grid switch medium high resolution settings editing horizontal vertical rul' +
          'ers displayed left bottom edges drawing board help accurately position joints structural model symme' +
          'try guides displayed drawing board help position joints structural model symmetrical title block dis' +
          'played lower right hand corner drawing board title block shows name bridge design project name desig' +
          'ner project identification name number designer project names changed time start new design may chos' +
          'e display truss template drawing board help easily design stable structural model'
  },
  {
    id: 'hlp_drawing_board_button',
    title: 'Drawing board button',
    text: 'click drawing board button return drawing board mode load test notes tips drawing board button locat' +
          'ed main toolbar also accessed test menu drawing board button load test button work pair. one pressed' +
          ' time'
  },
  {
    id: 'glos_drawing_grid',
    title: 'Drawing grid',
    text: 'drawing grid like piece graph paper drawing board grid made two sets parallel lines one horizontal o' +
          'ne vertical lines spaced 0.25 0.5 1.0 meters apart depending current grid resolution setting interse' +
          'ctions grid lines called snap points grid lines visible locations indicated marks vertical horizonta' +
          'l rulers located left bottom edges drawing board'
  },
  {
    id: 'glos_dynamic_load_allowance',
    title: 'Dynamic load allowance',
    text: 'dynamic load allowance factor used bridge design represent effect moving loads bridge designer uses ' +
          'dynamic load allowance 33% means moving truck causes 33% force bridge members stationary truck would' +
          ' cause'
  },
  {
    id: 'hlp_erase',
    title: 'Erase a joint or member',
    text: 'erase joint member structural model click eraser tool design tools palette click joint member want e' +
          'rase notes tips must drawing board mode erase joint member erase one joint member time erase joint m' +
          'embers attached joint also erased cannot erase joints created automatically bridge designer started ' +
          'new design erase member members higher member numbers re numbered fill gap also delete joint delete ' +
          'member remove structural model accidentally erase joint member click undo button restore'
  },
  {
    id: 'hlp_erase_tool',
    title: 'Eraser tool',
    text: 'use eraser tool erase joint member directly without select first notes tips eraser tool located desi' +
          'gn tools palette also available tools menu eraser tool use mouse pointer appears pencil cross showin' +
          'g cursor location move eraser tool drawing board joints members highlighted indicate item erased lef' +
          't button click'
  },
  {
    id: 'hlp_find_opt_substructure',
    title: 'Find the optimum site configuration and load case',
    text: 'design bridge go back one step go forward one step point design process optimized design one particu' +
          'lar site configuration load case one particular combination deck height span length support configur' +
          'ation deck material truck loading. wont know design truly optimal considered site configurations loa' +
          'd cases bridge designer allows 98 possible site configurations consisting various combinations deck ' +
          'elevation support type support height also four possible load cases consisting various combinations ' +
          'deck material truck loading total cost bridge equals site cost plus truss cost site configuration su' +
          'pports bridge different way thus different site cost load case different effect steel truss thus lik' +
          'ely result different truss cost even though site cost makes major portion bridges total cost picking' +
          ' configuration lowest site cost necessarily result lowest total cost site configurations low site co' +
          'st tend relatively high truss costs vice versa site configuration high deck elevation generally rela' +
          'tively low site cost requires little excavation yet configuration high deck elevation also greater s' +
          'pan length longer spans require larger heavier trusses leads higher truss costs arch abutments cost ' +
          'standard abutments tall arch abutments cost short ones thus site configurations use arches tend high' +
          'er site cost v shape river valley allows arch abutments reduce span length given deck height taller ' +
          'abutment shorter span arch abutments also provide lateral restraint standard abutments factors tend ' +
          'lower truss cost arches building pier middle river quite expensive thus configurations piers signifi' +
          'cantly higher site costs without pier also divides one long span two short ones two short trusses us' +
          'ually much less expensive single long one cable anchorages also expensive provide additional support' +
          ' thus reduce truss cost significantly example cable supports cable stayed bridge choice deck materia' +
          'l affects site cost loads applied load test medium strength concrete less expensive high strength co' +
          'ncrete results thicker deck heavier high strength concrete expensive results thinner deck lighter th' +
          'us less expensive deck material tends result higher truss cost expensive deck material results lower' +
          ' truss cost choice truck loading effect site cost significant effect truss cost lesson learned engin' +
          'eering design always involves tradeoffs tradeoff cost structure cost supporting substructure critica' +
          'lly important aspect real world bridge designs site configuration load case result lowest total cost' +
          ' way answer question trial error combined careful logical reasoning find optimum substructure config' +
          'uration click new design button project setup wizard displayed select one site configurations load c' +
          'ases havent tried yet best change one variable time draw valid conclusions effect change example sup' +
          'pose first design single span standard abutments deck height 24 meters second design might try arch ' +
          'leave deck height 24 meters cost difference two trials directly attributed different support type ch' +
          'ange support type deck height simultaneously wont know factors affects cost repeat previous eight st' +
          'eps design process new site configuration load case decide truss configuration draw joints draw memb' +
          'ers load test design strengthen unsafe members optimize member properties optimize shape truss optim' +
          'ize truss configuration compare results two trials draw logical conclusion one variable changed seco' +
          'nd trial particular deck height standard abutments arch abutments result lower cost large difference' +
          ' two large might able draw general conclusion two support types two results close youll probably nee' +
          'd trials try another site configuration load case change one characteristic second trial 4 meter hig' +
          'h arch might use 12 meter 16 meter height next trial repeat entire design process optimize truss new' +
          ' site configuration compare results previous trials use comparison logical basis new exploration con' +
          'duct trials able eliminate uneconomical site configurations load cases youve eliminated one optimum'
  },
  {
    id: 'hlp_try_new_configuration',
    title: 'Find the optimum truss configuration',
    text: 'design bridge go back one step go forward one step design inherently iterative process achieve truly' +
          ' optimal design probably need try many different truss configurations might guess however millions p' +
          'ossible configurations probably wont time try find optimum without modeling testing every possible t' +
          'russ configuration one approach consider alternative configurations systematic way select configurat' +
          'ion optimize member properties carefully observe changes configuration affected cost design keep tra' +
          'ck changes produce reductions cost use observations guide selection next alternative configuration f' +
          'ind optimum truss configuration try different deck location first design deck truss try correspondin' +
          'g truss configuration vice versa try different standard truss configuration example first design pra' +
          'tt truss try howe warren configuration try reducing length compression members truss compressive str' +
          'ength member function length member gets longer compressive strength decreases substantially much le' +
          'ss resistance buckling reason cost truss design sometimes reduced shortening one compression members' +
          ' example lets start standard warren truss top chords simple span truss bridge always compression mig' +
          'ht able reduce cost warren truss subdividing top chord members like consider standard pratt truss co' +
          'nfiguration top chords verticals normally compression thus could subdivide top chords verticals like' +
          ' note examples length compression member reduced half reduction length usually allow designer use su' +
          'bstantially smaller member size achieve required compressive strength note also subdivide member alw' +
          'ays need add additional joints members maintain stability truss stable truss generally must made ser' +
          'ies interconnected triangles subdivide compression member bridge designer must delete compression me' +
          'mber want subdivide add new joint near midpoint member deleted add two new members replace original ' +
          'member add additional members ensure stability optimize member properties new members reducing lengt' +
          'h compression members may may reduce total cost design depending whether cost saving using smaller m' +
          'ember sizes enough offset increased cost additional joints members try reducing number joints cost d' +
          'esign includes fixed cost per joint thus may able reduce total cost reducing number joints structura' +
          'l model example consider standard howe deck truss configuration improved simply removing joint midpo' +
          'int bottom chord like delete joint three attached members deleted well need add single new member re' +
          'place two bottom chord members deleted modification often effective tension members like bottom chor' +
          'd members example tensile strength function length however removing joint top chord truss shown less' +
          ' likely effective deleting top chord joint replacing two chord members one would double length compr' +
          'ession member making much weaker would need use substantially larger member size make member strong ' +
          'enough pass load test thus benefit reduced number joints would probably lost try inventing truss con' +
          'figuration copy configuration actual bridge examples actual bridge configurations might consider rec' +
          'ognize trusses could also designed deck truss'
  },
  {
    id: 'glos_floor_beams',
    title: 'Floor beams',
    text: 'floor beams transverse members support bridge deck transmit loads deck joints main trusses'
  },
  {
    id: 'glos_footing',
    title: 'Footing',
    text: 'footing base abutment pier portion foundation rests directly soil transmits load structure soil'
  },
  {
    id: 'glos_forces',
    title: 'Forces',
    text: 'force push pull weight common example force force measured pounds us system measurement newtons si s' +
          'ystem bridge designer forces reported kilonewtons kn'
  },
  {
    id: 'glossary',
    title: 'Glossary',
    text: 'aashto abutment anchorages arch abutments arch supports asphalt astm b bearing bridge design file bu' +
          'ckling c cable anchorages chords client compression concrete connections cut d deck deck truss diago' +
          'nals displacement drawing grid dynamic load allowance f floor beams footing forces j joints k kilone' +
          'wton kn l load factors load test loads m mass density member force member numbers member properties ' +
          'member size members modulus elasticity moment inertia p pier r reinforced concrete resistance factor' +
          ' safe session simple supports site cost slope snap points span standard abutments structural analysi' +
          's structural model substructure supports symmetrical template tension truss u unsafe v verticals w w' +
          'earing surface y yield stress yielding'
  },
  {
    id: 'hlp_go_back',
    title: 'Go back button',
    text: 'click go back button display previous design iteration drawing board notes tips go back button locat' +
          'ed main toolbar also available edit menu used go back button display previous design iteration use g' +
          'o forward button display recent iteration also use go iteration button display design iteration brid' +
          'ge designer remembers design iterations long remember work checked edit menu unchecked iterations lo' +
          'st time browser refreshed restarted'
  },
  {
    id: 'hlp_go_forward',
    title: 'Go forward button',
    text: 'click go forward button display recent design iteration drawing board notes tips go forward button l' +
          'ocated main toolbar also accessed edit menu go forward button activated used go back button least al' +
          'so use go iteration button display design iteration bridge designer remembers design iterations long' +
          ' remember work checked edit menu unchecked iterations lost time browser refreshed restarted'
  },
  {
    id: 'hlp_go_to',
    title: 'Go to iteration button',
    text: 'click go iteration button display design iteration browser use browser load drawing board design ite' +
          'ration browser displayed select iteration click ok alternately double click iteration notes tips use' +
          ' tree view tab see design iterations related go iteration button located main toolbar also available' +
          ' edit menu design iteration browser provides preview window help select iteration actually loading d' +
          'rawing board also display previous design iterations go back button bridge designer remembers design' +
          ' iterations long remember work checked edit menu unchecked iterations lost time browser refreshed re' +
          'started'
  },
  {
    id: 'hlp_grid_resolution',
    title: 'Grid resolution buttons',
    text: 'use grid resolution buttons set resolution drawing grid drawing board covered grid cant see there. d' +
          'raw move joints mouse snaps grid line intersections called snap points joints drawn snap points grid' +
          ' resolution buttons used set drawing grid low medium high resolution low resolution setting place jo' +
          'ints 1.0 meter intervals medium high resolution settings place joints 0.5 meter 0.25 meter intervals' +
          ' respectively three buttons work like radio buttons. one three depressed given time click one remain' +
          's depressed click either two notes tips grid resolution buttons located display toolbar also accesse' +
          'd view menu click grid resolution buttons rulers drawing board updated reflect new grid resolution e' +
          'xample low grid resolution rulers display markings 1.0 meter intervals high grid resolution markings' +
          ' displayed 0.25 meter intervals generally best create structural model using low resolution grid eas' +
          'ier control placement joints mode begin optimizing design might want switch medium high resolution g' +
          'rid setting refine shape structural model precisely editing structural model use keyboard arrows mov' +
          'e joints 0.25 meter intervals regardless current grid resolution setting thus take advantage high re' +
          'solution grid even without using grid resolution buttons'
  },
  {
    id: 'hlp_how_wpbd_works',
    title: 'How the bridge designer works',
    text: 'bridge designer intended educational purposes use bridge designer experience engineering design proc' +
          'ess simplified form design highway bridge much way practicing civil engineers design real highway br' +
          'idges presented requirement design steel truss bridge carry two lane highway across river may choose' +
          ' wide variety different site configurations bridge cause bridge carry loads different way different ' +
          'site cost develop design bridge drawing picture computer screen first design attempt complete bridge' +
          ' designer test bridge see strong enough carry specified highway loads test includes full color anima' +
          'tion showing truck crossing bridge design strong enough truck able cross successfully structure coll' +
          'apse bridge collapses strengthen changing properties structural components make bridge changing conf' +
          'iguration bridge bridge successfully carry highway loading without collapsing continue refine design' +
          ' objective minimizing cost still ensuring strong enough carry specified loads bridge designer gives ' +
          'complete flexibility create designs using shape configuration want creating design quick experiment ' +
          'many different alternative configurations work toward best possible one process youll use quite simi' +
          'lar one used practicing civil engineers design real structures indeed bridge designer quite similar ' +
          'computer aided design cad software used practicing engineers help way cad software helps taking care' +
          ' heavy duty mathematical calculations concentrate creative part design process good luck notes tips ' +
          'learn bridge designer cloud edition differs earlier versions see whats new bridge designer . bridge ' +
          'designer developed brigadier general retired stephen ressler re engineered twice open source brigadi' +
          'er general retired eugene ressler distributed freely provisions gnu public license version 3 intende' +
          'd solely educational use'
  },
  {
    id: 'hlp_how_to',
    title: 'How to design a bridge',
    text: 'use bridge designer experience engineering design process simplified form design steel truss bridge ' +
          'much way practicing civil engineers design real highway bridges objective create optimal bridge desi' +
          'gn optimal design one satisfies design specifications passes simulated load test costs little possib' +
          'le diagram shows effective method develop optimal design learn methodology click block diagram detai' +
          'led description particular step or.. click browse design process one step time'
  },
  {
    id: 'hlp_increase_member',
    title: 'Increase member size button',
    text: 'click increase member size button increase size currently selected members next larger notes tips in' +
          'crease member size button located member properties toolbar one member selected clicking button incr' +
          'ease size selected members even different example 50mm member 90mm member 120mm member selected clic' +
          'king button change 55mm 100mm 130mm respectively use increase member size button member size list up' +
          'dated reflect change use increase member size button two member properties lists material cross sect' +
          'ion type changed'
  },
  {
    id: 'hlp_joint_tool',
    title: 'Joint tool',
    text: 'use joint tool draw joints create structural model notes tips joint tool located design tools palett' +
          'e also available tools menu joint tool selected mouse pointer appears cross hair'
  },
  {
    id: 'glos_joints',
    title: 'Joints',
    text: 'joint point ends two members connected together truss joint assumed act like frictionless pin hinge ' +
          'prevent connected members rotating respect'
  },
  {
    id: 'glos_kilonewton',
    title: 'Kilonewton',
    text: 'kilonewton kn measurement force si metric system kilonewton 1000 newtons'
  },
  {
    id: 'glos_kn',
    title: 'kN',
    text: 'kn abbreviation kilonewton metric unit force. equivalent 225 pounds'
  },
  {
    id: 'hlp_load_a_template',
    title: 'Load and display a template',
    text: 'bridge designer includes variety truss templates load display drawing board light gray outlines trac' +
          'e template joints members create stable structural model load display template click load template f' +
          'ile menu select template click ok else double click template displayed drawing board notes tips must' +
          ' drawing board mode load template template loaded hide clicking template button toolbar view menu en' +
          'try'
  },
  {
    id: 'hlp_load_combinations',
    title: 'Load combinations',
    text: 'structural engineers use load combinations account fact structures often experience several differen' +
          't types loads time example bridge must simultaneously carry weight plus weight traffic pedestrians c' +
          'rossing it. bridge might also need carry loads caused high winds snow ice even earthquake highly unl' +
          'ikely extreme loads occur time reason structural design codes specify several different load combina' +
          'tions corresponds particular extreme event really heavy truck loading really strong earthquake examp' +
          'le load combination extreme loading combined average loads might present time 1994 aashto bridge des' +
          'ign specification requires bridge engineers check eleven different load combinations bridge design b' +
          'ridge designer uses one total load = 1.25 w + 1.5 w w + 1.75 1 + dla w = weight structure including ' +
          'deck structural components w w = weight asphalt wearing surface = weight aashto truck loading dla = ' +
          'dynamic load allowance numbers 1.25 1.5 1.75 load factors notes tips fact bridge designer considers ' +
          'one eleven different code specified load combinations one important reason software educational use ' +
          'reasons see realistic bridge designer'
  },
  {
    id: 'glos_load_factors',
    title: 'Load factors',
    text: 'load factor number normally greater 1 multiplied design load order represent extreme loading experie' +
          'nced structure example load factor 1.75 multiplied standard aashto h25 truck loading represent extre' +
          'mely heavy truck fact represents heaviest truck might reasonably expected cross bridge lifetime diff' +
          'erent kinds loads different load factors loads unpredictable others example weight bridge predictabl' +
          'e weight heavy truck load factor bridge weight much lower'
  },
  {
    id: 'hlp_load_template',
    title: 'Load template',
    text: 'click load template button load standard truss template display drawing board notes tips load templa' +
          'te button available file menu'
  },
  {
    id: 'glos_load_test',
    title: 'Load test',
    text: 'bridge designer load test simulated test well design would perform built placed service load test br' +
          'idge subjected self weight weight standard aashto h25 truck loading every member structural model ch' +
          'ecked structural safety'
  },
  {
    id: 'hlp_load_test3',
    title: 'Load test animation',
    text: 'load test animation graphical simulation bridge undergoing load test start animation click load test' +
          ' button animation begins bridge subjected weight steel structural elements concrete deck asphalt wea' +
          'ring surface self weight applied aashto h25 truck moves across bridge left right loads applied bridg' +
          'e bends displacements bridge may exaggerated factor 10 illustrate truss members shorten elongate car' +
          'ry load member forces increase members change color red compression blue tension intense color close' +
          'r member failure one members found unsafe animation shows members failing bridge might look begins c' +
          'ollapse notes tips pause rewind restart animation time using animation controls change appearance lo' +
          'ad test animation opt show changing load test options whenever member found unsafe load test animati' +
          'on depicts failure member either yielding buckling failure mode entirely realistic engineers always ' +
          'build margin safety structural members margin represented load factors code specified load combinati' +
          'ons resistance factors equations tensile strength compressive strength unsafe member might fail migh' +
          't continue carry load reduced margin safety actual bridge possible one members fail without causing ' +
          'total collapse structure however member found unsafe bridge designer considers design unsuccessful'
  },
  {
    id: 'hlp_load_test_button',
    title: 'Load test button',
    text: 'click load test button load test current design notes tips load test button located main toolbar als' +
          'o available test menu load test button drawing board button work tandem one depressed given time cli' +
          'ck one remains depressed click exception youve turned show animation option test menu causes mode sw' +
          'itch back drawing board immediately test complete'
  },
  {
    id: 'hlp_load_test_options',
    title: 'Load test options',
    text: 'auto correct errors check box test menu causes bridge designer attempt identify source instability u' +
          'nstable structural model modify load tested modifications might include deleting unattached joint me' +
          'mber adding new required members. modifications might successful depending type extent instability s' +
          'till best keep option switched unless theres good reason turn show animation check box test menu swi' +
          'tched load test animation displayed every load test animation shown user returned immediately drawin' +
          'g board mode load test exaggeration check box animation controls palette switched bending bridge exa' +
          'ggerated factor 10 show clearly truss members shorten elongate carry load option displacements exagg' +
          'erated member colors check box animation controls palette switched members change color animation sh' +
          'ow magnitude member force red compression blue tension intense color closer member failure switched ' +
          'members change color animation notes tips computer perform well game quality animation graphics use ' +
          'test menu check use old style graphics checkbox exaggeration member colors options turned make bridg' +
          'e appear realistic possible'
  },
  {
    id: 'hlp_load_test_status',
    title: 'Load test status',
    text: 'current status design displayed icon status toolbar design always one three possible states construc' +
          'tion structural model yet completed changed since last load test unsafe structural model load tested' +
          ' one members strong enough safely carry specified loads safe structural model load tested members st' +
          'rong enough safely carry specified loads notes tips anytime make change structural model status chan' +
          'ge construction another load test run get detailed numerical results recent load test click report l' +
          'oad test results button member list also summary'
  },
  {
    id: 'hlp_run_load_test',
    title: 'Load test your design',
    text: 'design bridge go back one step go forward one step complete stable structural model must run simulat' +
          'ed load test ensure members design strong enough carry loads prescribed design specification 5 load ' +
          'test design click load test button sit back watch bridge designer perform load test display load tes' +
          't animation update load test status display animation appear may computer thats incompatible advance' +
          'd graphics features cloud edition see use old style graphics menu item switch basic graphics virtual' +
          'ly computers support load test complete click drawing board button return drawing board notes tips c' +
          'lick load test mode button bridge designer automatically perform following actions create pin roller' +
          ' supports appropriate locations structural model calculate weight members apply forces structure loa' +
          'ds calculate weight concrete bridge deck asphalt wearing surface floor beams see design specificatio' +
          'n 5 information apply corresponding loads structure apply aashto h25 truck loading structure multipl' +
          'e positions representing movement truck across bridge check structural model stability structural mo' +
          'del unstable bridge designer attempt fix problem unsuccessful stop load test inform problem provide ' +
          'suggestions fixing return drawing board perform structural analysis considering combined effects bri' +
          'dge self weight truck loading truck position calculate displacement joint member force member struct' +
          'ural model member compare calculated member forces truck positions determine absolute maximum tensio' +
          'n force absolute maximum compression force. critical forces determine whether given member safe calc' +
          'ulate tensile strength compressive strength member member compare absolute maximum tension force ten' +
          'sile strength compare absolute maximum compression force compressive strength force exceeds strength' +
          ' either case member unsafe member safe prepare display load test animation update load test status d' +
          'isplay save time run load test without displaying load test animation use load test options switch a' +
          'nimation dont want bridge designer attempt automatically fix unstable structure use load test option' +
          's switch feature'
  },
  {
    id: 'glos_loads',
    title: 'Loads',
    text: 'loads forces applied structure highway bridge loads include weight vehicles cross bridge weight brid' +
          'ge cases weight snow ice structure forces caused high winds earthquakes'
  },
  {
    id: 'hlp_local_contest',
    title: 'Local contest code',
    text: 'bridge designer includes support local bridge design contests 6 character local contest code may ent' +
          'ered design project setup wizard code causes automatic selection site conditions including load case' +
          ' task design best possible bridge conditions future enhancement bridge designer depends suitable fun' +
          'ding automatically produce scoreboard designs code youll manually track whos winning enter local con' +
          'test code click new design button display project setup wizard step 2 wizard check yes enter code te' +
          'xt box notes tips first three characters local contest code used uniquely identify contest e.g. nhs ' +
          'northampton high school next two two digit number representing site configuration i.e. deck elevatio' +
          'n supports final character letter b c d designating load case load case consists one two truck avail' +
          'able loadings combined one two available concrete deck thicknesses soon valid 6 character local cont' +
          'est code entered design project setup wizard corresponding site configuration load case displayed pr' +
          'eview window'
  },
  {
    id: 'glos_mass_density',
    title: 'Mass density',
    text: 'mass density material mass per unit volume mass density steel significantly higher concrete asphalt'
  },
  {
    id: 'hlp_material_densities',
    title: 'Material density',
    text: 'density material mass per unit volume bridge designer uses material densities specified 1994 aashto ' +
          'bridge design specifications follows reinforced concrete 2400 kg per cubic meter asphalt 2250 kg per' +
          ' cubic meter steel types 7850 kg per cubic meter'
  },
  {
    id: 'hlp_materials',
    title: 'Materials',
    text: 'bridge designer allows use three different materials design carbon steel common grade structural ste' +
          'el composed primarily iron 0.26% carbon high strength low alloy steel increasingly popular structura' +
          'l steel similar carbon steel significantly stronger higher strength attained small amounts manganese' +
          ' columbium vanadium alloying elements added manufacturing process quenched tempered low alloy steel ' +
          'high strength steel similar high strength low alloy steel strength increased special heat treating p' +
          'rocess notes tips material best choice given structural design answer depends largely relative impor' +
          'tance cost strength yield stress design carbon steel least expensive three alternatives also lowest ' +
          'strength high strength low alloy steel somewhat expensive 40% stronger carbon steel quenched tempere' +
          'd low alloy steel strongest expensive three three materials approximately density modulus elasticity' +
          ' best material often varies structure structure design may use one youll need experiment determine m' +
          'aterials best design determine numerical values yield stress mass density modulus elasticity given m' +
          'aterial use member details tab determine unit cost material check cost calculations report'
  },
  {
    id: 'hlp_member_details',
    title: 'Member details',
    text: 'member details interactive explorer displays detailed engineering information materials cross sectio' +
          'ns sizes selected members members selected displays information members member properties lists memb' +
          'er details member list occupy screen location. member list visible change member details clicking ta' +
          'b upper right corner member details include material properties yield stress modulus elasticity mass' +
          ' density cross section properties cross sectional area moment inertia graph member strength vs lengt' +
          'h tension yielding compression buckling maximum member length passing slenderness test also shown co' +
          'st per meter member made selected material cross section size members selected separate members tab ' +
          'presented set members consisting material cross section lengths members drawn vertical lines strengt' +
          'h curve one highlighted highlighted member selected member selector click arrow buttons select membe' +
          'r number drop list. tabs drawn single strength curve selecting check box notes tips member length co' +
          'st shown member details exactly one member selected'
  },
  {
    id: 'glos_member_force',
    title: 'Member force',
    text: 'member force internal force developed member result loads applied structure member force either tens' +
          'ion compression'
  },
  {
    id: 'hlp_member_list',
    title: 'Member list',
    text: 'member list movable grid normally displayed right hand side bridge design window use member list red' +
          'uces space available drawing board however easily hidden make space editing structural model member ' +
          'list member details occupy screen location member details visible change member list clicking tab up' +
          'per right member list following lists members current structural model lists engineering properties ' +
          'length material cross section member size slenderness ratio member provides recent load test results' +
          ' member provides convenient way select one members allows sorting members member number engineering ' +
          'properties load test results notes tips member list load test results shown ratios member force stre' +
          'ngth compression tension ratio greater one member unsafe members unsafe tension highlighted blue uns' +
          'afe compression highlighted red ratio less one member safe ratio much less one member much stronger ' +
          'needs probably uneconomical member list hidden restored view member list button select member click ' +
          'corresponding row member list selected member highlighted light blue member list drawing board click' +
          ' drag mouse button select range members alternately select range clicking one member holding shift k' +
          'ey clicking second member selects clicked members members select one member range hold ctrl key clic' +
          'king rows member list sort member list click heading column sort example sort members length click h' +
          'eading length column first time click column heading list sorted ascending order click sorted descen' +
          'ding order third click restores default sort order number member list used efficiently optimize memb' +
          'er properties structural model. immediately following load test sort compression load test results c' +
          'licking compression force/strength column heading. list sorted safe least safe unsafe members bottom' +
          ' list highlighted red excessively strong i.e. uneconomical members top select block members needs ma' +
          'de larger smaller using click drag shift selection use increase member size button decrease member s' +
          'ize button change selected rows repeat tension load test results'
  },
  {
    id: 'glos_member_numbers',
    title: 'Member numbers',
    text: 'every member structural model member number. numbers assigned order create members . physical signif' +
          'icance member numbers used reference member properties load test results reported member number memb' +
          'er list'
  },
  {
    id: 'glos_member_properties',
    title: 'Member properties',
    text: 'properties member 1 material made 2 type cross section 3 member size'
  },
  {
    id: 'hlp_member_properties',
    title: 'Member properties lists',
    text: 'use three member properties lists define material cross section member size member structural model ' +
          'choose member property click drop button reveal list items click item want member size list also upd' +
          'ated using increase member size decrease member size buttons notes tips member properties lists loca' +
          'ted member properties toolbar adding new members material cross section size currently displayed mem' +
          'ber properties lists automatically assigned new member created editing structural model member prope' +
          'rties lists used change properties currently selected members members selected member properties lis' +
          'ts show properties used largest number members current design'
  },
  {
    id: 'glos_member_size',
    title: 'Member size',
    text: 'size member represented dimensions cross section millimeters'
  },
  {
    id: 'hlp_member_tool',
    title: 'Member tool',
    text: 'use member tool draw members create structural model notes tips member tool located design tools pal' +
          'ette also accessed tools menu member tool selected mouse pointer appears pencil'
  },
  {
    id: 'glos_members',
    title: 'Members',
    text: 'members individual structural elements make truss members connected joints'
  },
  {
    id: 'hlp_menu_bar',
    title: 'Menu bar',
    text: 'menu bar located top bridge design window immediately title bar menu bar provides following commands' +
          ' file new design open file save file save open sample design load template print design recently ope' +
          'ned files exit edit select delete undo redo go back go forward go iteration increase member size dec' +
          'rease member size remember work view design tools animation controls member list rulers title block ' +
          'member numbers symmetry guides template grid resolution drawing tools joint tool member tool select ' +
          'tool eraser tool test drawing board load test show animation use old style graphics auto correct err' +
          'ors report cost calculations load test results help tip day'
  },
  {
    id: 'glos_modulus_of_elasticity',
    title: 'Modulus of elasticity',
    text: 'modulus elasticity measure materials stiffness resistance deformation material high modulus elastici' +
          'ty deforms little loaded modulus elasticity represented symbol e expressed units force per unit area'
  },
  {
    id: 'glos_moment_of_inertia',
    title: 'Moment of inertia',
    text: 'moment inertia measure members resistance bending buckling function shape dimensions cross section m' +
          'oment inertia represented symbol expressed units length raised 4th power'
  },
  {
    id: 'hlp_move_joint',
    title: 'Move a joint',
    text: 'move joint mouse click select tool design tools palette position mouse pointer joint want move press' +
          ' left mouse button hold move mouse pointer new joint location release button joint redrawn new locat' +
          'ion move joint keyboard click select tool design tools palette click joint want move selected joint ' +
          'turn light blue use arrow keys keyboard move joint desired direction 0.25 meter increments notes tip' +
          's must drawing board mode move joint joint already members attached members automatically reposition' +
          'ed along joint joints created automatically bridge designer start new design cannot moved cannot mov' +
          'e one joint top another joint site configurations high pier joints cannot moved onto pier joint drag' +
          'ged mouse joint moves increments corresponding current resolution drawing grid joint moved keyboard ' +
          'moves 0.25 meter increments regardless current grid resolution thus keyboard technique good making s' +
          'mall adjustments position joint'
  },
  {
    id: 'hlp_multiple_selection',
    title: 'Multiple selection of members',
    text: 'use multiple selection change properties several members simultaneously delete several members simul' +
          'taneously five different ways multiple selection drag box click select tool design tools palette hol' +
          'ding left button mouse drag box around members want select release mouse button members entirely enc' +
          'losed within box selected drag left right members completely inside box selected drag right left mem' +
          'bers either inside box touching selected ctrl click drawing board click select tool design tools pal' +
          'ette hold ctrl key keyboard drawing board individually click members want select ctrl click member l' +
          'ist hold ctrl key keyboard member list individually click members want select shift click member lis' +
          't block selection member list click one member start block. hold shift key keyboard member list clic' +
          'k second member complete block members listed first second inclusive selected click drag member list' +
          ' block selection member list click one member start block. drag release select desired block select ' +
          'click select button main toolbar every member structural model selected notes tips selected members ' +
          'turn light blue drawing board member list de select selected members click anywhere drawing board me' +
          'mber de select single member without de selecting remaining members multiple selection hold ctrl key' +
          ' click member want de select'
  },
  {
    id: 'hlp_new_design',
    title: 'New design button',
    text: 'click new design button start new bridge design click button project setup wizard displayed notes ti' +
          'ps new design button located main toolbar also accessed file menu'
  },
  {
    id: 'hlp_open_sample_design',
    title: 'Open a sample design',
    text: 'bridge designer includes variety sample designs open modify load test stable truss configurations no' +
          'ne optimized minimum cost load sample design click open sample design entry file menu select sample ' +
          'design click ok double click sample design displayed drawing board notes tips must drawing board mod' +
          'e load sample design current structural model saved prompted save sample design loaded'
  },
  {
    id: 'hlp_open_existing',
    title: 'Open an existing bridge design file',
    text: 'open existing bridge design file click open file button main toolbar choose disk drive folder filena' +
          'me want open click ok notes tips default file extension bridge design files created bridge designer ' +
          '.bdc bridge designer cannot read .bdf .bd4 bdc bridge design files created earlier versions software' +
          ' sorry backward compatibility impossible bridge designer use annual bridge design contest current de' +
          'sign saved prompted save open file'
  },
  {
    id: 'hlp_open_file',
    title: 'Open file button',
    text: 'click open file button open existing bridge design file notes tips open file button located main too' +
          'lbar also accessed file menu'
  },
  {
    id: 'hlp_optimize_member_selection',
    title: 'Optimize the member properties',
    text: 'design bridge go back one step go forward one step structural model unsafe members design successful' +
          ' however design optimum minimize cost first step optimizing design minimize cost current truss confi' +
          'guration optimizing member properties material cross section member size stage design process change' +
          ' shape configuration current structural model optimize member properties ensure understand bridge de' +
          'signer calculates cost design particular understand trade material cost product cost minimize materi' +
          'al cost several approaches might use minimize material cost following procedure recommended inexperi' +
          'enced designers start using lowest cost weakest available material carbon steel members select appro' +
          'priate cross section member usually best use solid bars tension members hollow tubes compression mem' +
          'bers information see solid bar hollow tube use systematic trial error procedure determine smallest p' +
          'ossible member size every member structural model starting successful design decrease size every mem' +
          'ber next smaller available size see change properties member information. run load test member fails' +
          ' size small change back previous larger size member safe decrease size run load test keep reducing s' +
          'ize running load test member fails increase size one use process systematically every member structu' +
          'ral model ensure every member small inexpensive possibly without failing finally go back check using' +
          ' either two materials high strength steel quenched tempered steel reduce overall cost design steels ' +
          'significantly higher yield stress carbon steel using allow reduce size members without reducing stre' +
          'ngth high strength steel quenched tempered steel expensive dollars per kilogram carbon steel need us' +
          'e trial error determine benefit increased strength sufficient offset greater cost high strength stee' +
          'ls permissible use two three different materials design adjusted materials cross sections member siz' +
          'es minimize material cost design sure run load test ensure members safe optimize based product cost ' +
          'minimized material cost probably introduced large number different products design thus even though ' +
          'material cost low product cost probably quite high total cost almost certainly optimum use following' +
          ' procedure find best balance two competing cost factors check cost calculations report see many prod' +
          'ucts currently included design particular identify products used members structural model change pro' +
          'perties particular members match next larger next stronger available product current design example ' +
          'suppose design includes two 40 mm solid carbon steel bars four 60 mm solid carbon steel bars change ' +
          'two 40 mm bars 60 mm bars modification increase material cost somewhat reduce number products one mo' +
          'dification probably reduce safety structure since making two 40 mm members stronger reduction produc' +
          't cost exceeds increase material cost change good one reject change clicking undo button continue tr' +
          'ial error process selectively increasing member sizes using stronger materials reduce total number p' +
          'roducts design generally find reducing number products creates substantial cost savings first howeve' +
          'r degree standardization increases cost savings get progressively less ultimately much standardizati' +
          'on cause total cost design rise design minimizes total cost optimum moving next step design process ' +
          'sure run load test one time even modifications involved making members larger increasing size member' +
          ' makes member stronger heavier member weights increase total weight truss increases result increase ' +
          'load member forces also increase members previously safe might become unsafe notes tips optimize mem' +
          'ber properties efficiently taking full advantage sorting multiple selection capabilities member list'
  },
  {
    id: 'hlp_optimize_configuration',
    title: 'Optimize the shape of the truss',
    text: 'design bridge go back one step go forward one step point design process optimized member properties ' +
          'one specific truss configuration probably configurations result economical designs design inherently' +
          ' iterative process achieve truly optimal design need experiment many different configurations carefu' +
          'lly observe changes truss geometry affect cost design try totally new truss configuration first opti' +
          'mize shape current structural model change shape truss moving one joints dragging new location mouse' +
          ' keyboard modification easy produce significant reductions cost design optimize shape current struct' +
          'ural model try changing depth truss example suppose started standard pratt truss current design migh' +
          't try reducing depth might try increasing depth first glance reducing depth truss might seem like be' +
          'tter alternative reducing depth make verticals diagonals shorter since members require less material' +
          ' cost decrease. however reducing depth truss also causes member force top bottom chords increase thu' +
          's probably need increase size cost top bottom chord members ensure design still passes load test inc' +
          'rease depth truss opposite effects occur verticals diagonals get longer thus increase cost member fo' +
          'rces top bottom chords decrease allowing use smaller less expensive members chords trade two competi' +
          'ng factors 1 member force top bottom chords 2 length verticals diagonals every truss optimum depth r' +
          'epresents best compromise two factors best way find optimum depth design trial error try changing ov' +
          'erall shape truss example suppose started standard pratt truss current design try moving top chord j' +
          'oints create rounded shape often minor adjustment reduce cost design significantly truss rounded sha' +
          'pe member forces tend nearly equal every member top chord thus get shape right use single optimum me' +
          'mber size entire top chord resulting substantial reduction product cost changing rounded shape also ' +
          'effective bottom chord deck truss notes tips whenever change shape truss need repeat previous three ' +
          'steps design process 1 run load test 2 identify strengthen unsafe members 3 optimize member properti' +
          'es determine whether change effective reducing cost design'
  },
  {
    id: 'glos_pier',
    title: 'Pier',
    text: 'pier part bridge substructure provides intermediate support multi span bridge'
  },
  {
    id: 'hlp_pinned_support',
    title: 'Pinned support',
    text: 'pinned support represented symbol prevents joint structural model moving horizontally vertically'
  },
  {
    id: 'hlp_print_drawing',
    title: 'Print a drawing',
    text: 'click print button main toolbar send black white drawing design printer notes tips printed drawing s' +
          'hows configuration truss annotated member numbers dimensions member properties shown tabular format ' +
          'bottom page many bridges look best printed landscape mode thats bridge oriented across longest dimen' +
          'sion page web browsers youll able choose dialog appears immediately pressing print'
  },
  {
    id: 'hlp_print_load_test',
    title: 'Print the load test results',
    text: 'print report recent load test ensure printer connected line click report load test results button st' +
          'atus toolbar load test results report shown table separate window click print button right hand side' +
          ' window follow browswers printing instructions send report printer notes tips load test results repo' +
          'rt also copied windows clipboard clicking copy button right hand side window data copied tab delimit' +
          'ed text format format pasted directly microsoft excel spreadsheet word notepad document'
  },
  {
    id: 'hlp_printer',
    title: 'Printers and printing',
    text: 'bridge designer makes use web browsers printing capability print bridges check browsers maker detail' +
          's select printer set example choosing landscape portrait mode'
  },
  {
    id: 'hlp_purposes',
    title: 'Purposes',
    text: 'purposes bridge designer provide opportunity learn engineering design process provide realistic hand' +
          's experience help understand civil engineers design structures demonstrate engineers use computer to' +
          'ol improve effectiveness efficiency design process provide tool visualizing structural behavior tool' +
          ' help understand structures work notes tips overview software functions see bridge designer works br' +
          'idge designer developed brigadier general stephen ressler 2nd edition series bridge designer includi' +
          'ng windows mac os x versions developed colonel eugene ressler versions distributed freely provisions' +
          ' gnu public license intended solely educational use'
  },
  {
    id: 'hlp_record_design',
    title: 'Record your design',
    text: 'design bridge go back one step completed design record document efforts use reference future designs' +
          ' record final design save design bridge design file print drawing design print load test results not' +
          'es tips dont wait design complete save bridge design file save early save often case...'
  },
  {
    id: 'hlp_redo',
    title: 'Redo button',
    text: 'click redo button restore change structural model mistakenly undone notes tips redo button located m' +
          'ain toolbar also accessed edit menu redo button works conjunction undo button'
  },
  {
    id: 'glos_reinforced_concrete',
    title: 'Reinforced concrete',
    text: 'reinforced concrete concrete steel reinforcing rods embedded inside added strength concrete strong c' +
          'ompression comparatively weak tension reinforcing bars substantially increase ability reinforced con' +
          'crete carry tension'
  },
  {
    id: 'hlp_remember_my_work',
    title: 'Remember my work',
    text: 'bridge designer keep track work still even refresh close restart browser enable feature check rememb' +
          'er work entry bottom edit menu best keep checked nearly time exception using shared login user id ot' +
          'hers computer unchecking box leave prevents seeing design'
  },
  {
    id: 'hlp_report_cost',
    title: 'Report cost calculations button',
    text: 'click report cost calculations button show cost current design calculated cost calculations report s' +
          'hown table separate window report printed copied windows clipboard notes tips report cost calculatio' +
          'ns button located status toolbar also accessed report menu use print button right hand side cost cal' +
          'culations report window send copy report printer use copy button right hand side cost calculations r' +
          'eport window copy report windows clipboard data tab delimited ascii text format data pasted directly' +
          ' microsoft excel spreadsheet microsoft word document word adjustment tab settings may necessary get ' +
          'numbers display correctly'
  },
  {
    id: 'hlp_report_load_test',
    title: 'Report load test results button',
    text: 'click report load test results button display detailed numerical results recent load test load test ' +
          'results report shown table separate window report printed copied windows clipboard use results basis' +
          ' strengthening failed members optimizing selection members structural model notes tips report load t' +
          'est results button located status toolbar also accessed report menu load test results report include' +
          's following member structural model absolute maximum compression force member kilonewtons kn compres' +
          'sive strength member kn compression status ok buckles absolute maximum tension force member kn tensi' +
          'le strength member kn tension status ok yields use print button right hand side load test results re' +
          'port window print copy report printer use copy button right hand side load test results report windo' +
          'w copy report windows clipboard data tab delimited ascii text format data pasted directly microsoft ' +
          'excel spreadsheet microsoft word document word adjustment tab settings may necessary get numbers dis' +
          'play correctly'
  },
  {
    id: 'glos_resistance_factor',
    title: 'Resistance factor',
    text: 'resistance factor dimensionless number used calculation tensile strength compressive strength struct' +
          'ural members resistance factor provides margin safety design accounts uncertainty material strength ' +
          'member dimensions construction quality resistance factor always less equal 1'
  },
  {
    id: 'hlp_restrictions',
    title: 'Restrictions on the use of Bridge Designer',
    text: 'bridge designer intended educational use warranty kind expressed implied authors use software commer' +
          'cial construction purposes prohibited notes tips understand bridge designer good designing real brid' +
          'ge see realistic bd try would invite disaster destruction injury death need design real bridge must ' +
          'obtain services registered professional civil engineer'
  },
  {
    id: 'hlp_roller_support',
    title: 'Roller support',
    text: 'roller support represented symbol prevents joint structural model moving vertically joint still free' +
          ' move horizontally however'
  },
  {
    id: 'hlp_rulers',
    title: 'Rulers',
    text: 'horizontal vertical rulers displayed left bottom edges drawing board rulers allow accurately determi' +
          'ne position mouse pointer draw move joints structural model notes tips rulers calibrated meters mark' +
          's rulers show locations snap points drawing grid switch low resolution medium resolution high resolu' +
          'tion drawing grid using grid resolution buttons measurement marks rulers reflect current grid resolu' +
          'tion setting hide display rulers using view rulers button hide rulers drawing board becomes slightly' +
          ' larger scale rulers shows upper lower limits drawing grid defined design specifications scale horiz' +
          'ontal ruler begins zero ends specified span length scale vertical ruler begins specified minimum ele' +
          'vation ends specified maximum elevation'
  },
  {
    id: 'glos_safe',
    title: 'Safe',
    text: 'member safe internal member force less strength member tension compression'
  },
  {
    id: 'hlp_save_as',
    title: 'Save as button',
    text: 'click save button save current design new file name notes tips save button accessed file menu want c' +
          'hange file name associated current design use save file button'
  },
  {
    id: 'hlp_save_file',
    title: 'Save file button',
    text: 'click save file button save current design bridge design file saved model previously prompted filena' +
          'me directory disk drive saved structural model previously clicking save file button causes design sa' +
          'ved filename notes tips save file button located main toolbar also accessed file menu wish save stru' +
          'ctural model new filename use save button'
  },
  {
    id: 'hlp_save_your_design',
    title: 'Save the current design',
    text: 'time design process save current design bridge design file three different ways save design previous' +
          'ly saved design click save file button main toolbar choose disk drive folder want save file enter fi' +
          'le name click ok previously saved design want change file name click save file button main toolbar e' +
          'xisting bridge design file overwritten new design file name remain previously saved design want chan' +
          'ge file name click save button file menu choose disk drive folder want save file enter new file name' +
          ' click ok notes tips default file extension bridge design files created bridge designer .bdc specify' +
          ' file extension enter file name .bdc extension added automatically strongly recommend use default .b' +
          'dc extension bridge design files bridge design files created bridge designer cannot read earlier ver' +
          'sions software save structural model time even incomplete'
  },
  {
    id: 'hlp_select_project',
    title: 'Select a site configuration and load case',
    text: 'design bridge go forward one step every time start bridge designer welcome dialog box offer followin' +
          'g three options select create new bridge design option click ok design project setup wizard displaye' +
          'd first review design requirement familiarize project site displayed preview window click next butto' +
          'n enter local contest code participating local bridge design contest enter valid local contest code ' +
          'associated site configuration load case automatically set drawing board enter local contest code may' +
          ' choose 98 available site configurations four available load cases click next button make selections' +
          ' site configuration site configuration consists elevation deck high water level choice standard abut' +
          'ments simple supports arch abutments arch supports height arch abutments used choice pier pier heigh' +
          't pier used choice one two cable anchorages cable anchorages selections affects site cost displayed ' +
          'near bottom design project setup wizard along corresponding calculations made selections click next ' +
          'button select load case load case load case consists choice medium strength high strength concrete d' +
          'eck choice two aashto h25 truck loads one traffic lane one single 660 kn permit loading laterally ce' +
          'ntered deck made selections may click finish button complete design project setup activate drawing b' +
          'oard notes tips program running way change site configuration load case start new design. clicking n' +
          'ew design button display design project setup wizard 98 possible site configurations consisting vari' +
          'ous combinations deck elevation support type support height four possible load cases consisting comb' +
          'inations two available deck materials two available truck loadings overall bridge designer offers 39' +
          '2 possible design projects project represents different type support loading one different cost 392 ' +
          'consistent design specifications total cost bridge equals site cost plus truss cost site configurati' +
          'on different cost site cost makes substantial portion total cost bridge picking configuration lowest' +
          ' site cost necessarily result lowest total cost general site configurations low site cost tend relat' +
          'ively high truss cost vice versa site configuration high deck elevation generally relatively low sit' +
          'e cost higher deck requires little excavation configuration high deck elevation also greater span le' +
          'ngth longer span requires larger heavier truss results higher truss cost arch abutments cost standar' +
          'd abutments tall arch abutments cost short ones thus site configurations use arches tend higher site' +
          ' cost. v shape river valley arch abutments also reduce span length given deck height taller abutment' +
          ' shorter span arch abutments also provide lateral restraint standard abutments factors tend cause tr' +
          'uss cost less arches building pier middle river quite expensive thus configurations piers significan' +
          'tly higher site costs without piers pier also divides one long span two short ones two short trusses' +
          ' usually much less expensive single long one cable anchorages also expensive provide additional supp' +
          'ort e.g. cable supports cable stayed bridge thus reduce truss cost significantly choice deck materia' +
          'l affects site cost loads applied load test medium strength concrete less expensive high strength co' +
          'ncrete results thicker deck heavier high strength concrete expensive results thinner deck lighter th' +
          'us less expensive deck material tends result higher truss cost expensive deck material results lower' +
          ' truss cost choice truck loading effect site cost significant effect truss cost engineering design a' +
          'lways involves tradeoffs tradeoff cost structure cost supporting substructure critically important a' +
          'spect real world bridge designs site configuration load case result lowest total cost dont worry tak' +
          'e best guess move next step design process well try find optimum site configuration later process'
  },
  {
    id: 'hlp_select_all',
    title: 'Select all button',
    text: 'click select button select every member current structural model members selected change member prop' +
          'erties simultaneously notes tips select button located main toolbar also accessed edit menu'
  },
  {
    id: 'hlp_select_tool',
    title: 'Select tool',
    text: 'use select tool edit structural model need move joint delete joint change member properties delete m' +
          'ember youll need select joint member first clicking select tool notes tips select tool located desig' +
          'n tools palette also accessed tools menu select tool use mouse pointer appears arrow move select too' +
          'l drawing board joints members highlighted indicate mouse pointer close enough select'
  },
  {
    id: 'glos_session',
    title: 'Session',
    text: 'initiate new session anytime start new design load sample design open existing bridge design file wi' +
          'thin given session design iterations preserved revert previous design iteration time session clickin' +
          'g go back button'
  },
  {
    id: 'hlp_setup_wizard',
    title: 'Setup wizard',
    text: 'project setup wizard automatically displayed every time start bridge designer choose create new desi' +
          'gn display wizard time click new design button project setup wizard erase drawing board set new desi' +
          'gn prompt read understand design requirement enter local contest code optional skip unless youre par' +
          'ticipating local bridge design contest select deck elevation support configuration bridge select dec' +
          'k material truck loading used design optinally select standard truss template guide design enter des' +
          'igners name project identification name number title block step site design click next button advanc' +
          'e click back button return previous page change selections click finish button accept selections ret' +
          'urn drawing board click cancel button reject selections return drawing board click finish button wiz' +
          'ard automatically create joints support bridge deck see design specification 3.g information also cr' +
          'eate additional supports site configuration youve selected notes tips deck elevation support configu' +
          'ration deck material choose determine site cost project cost displayed bottom setup wizard automatic' +
          'ally updated change deck elevation support configuration see details showing site cost calculated cl' +
          'ick arrow near lower right hand corner project setup wizard youve selected deck elevation support co' +
          'nfiguration click finish button time rest setup optional'
  },
  {
    id: 'hlp_show_animation',
    title: 'Show animation check box',
    text: 'checking menu entry tools show animation causes 3d load test animation shown immediately every load ' +
          'test. uncheck box continue drafting immediately load test notes tips disabling animation allows quic' +
          'ker design iterations'
  },
  {
    id: 'glos_simple_supports',
    title: 'Simple supports',
    text: 'simple supports consist pin one end span roller end roller allows lateral expansion contraction brid' +
          'ge due loads temperature changes bridge designer standard abutments use simple supports'
  },
  {
    id: 'glos_site_cost',
    title: 'Site cost',
    text: 'bridge designer site cost includes cost substructure abutments piers support bridge cost concrete de' +
          'ck site cost must added truss cost determine total project cost'
  },
  {
    id: 'hlp_slenderness',
    title: 'Slenderness check',
    text: 'slender members difficult handle construction site. tend inadvertently bent buckled fabrication slen' +
          'derness check evaluation reduce likelihood sort accidental damage occur slenderness check performed ' +
          'bridge designer based american institute steel construction design code member passes slenderness ch' +
          'eck slenderness ratio l / r meets following condition l / r < 300 l length member r radius gyration ' +
          'member cross section radius gyration r calculated moment inertia member cross sectional area member ' +
          'member fails slenderness check considered unserviceable notes tips bridge designer slenderness check' +
          ' performed automatically draw new member change cross section properties existing member member fail' +
          's slenderness check i.e. l / r greater 300 member highlighted magenta one members fail slenderness c' +
          'heck bridge designer perform load test fix member fails slenderness check decrease length increase m' +
          'ember size given member size hollow tubes lower l / r solid bars thus solid bar fails slenderness ch' +
          'eck might also fixed changing hollow tube see maximum length member given cross section member size ' +
          'without failing slenderness check click report member properties button maximum length indicated ver' +
          'tical line colored magenta obtain numerical values given cross section member size click report memb' +
          'er properties button'
  },
  {
    id: 'glos_slenderness',
    title: 'Slenderness ratio',
    text: 'slenderness ratio number describes thickness member members long comparison cross sections larger sl' +
          'enderness ratios shorter slender members likely buckle damaged handling. slenderness check ensures m' +
          'embers slenderness ratios 300 overly slender member causes bridge fail'
  },
  {
    id: 'glos_slope',
    title: 'Slope',
    text: 'slope roadway embankment measure steepness expressed ratio vertical distance horizontal distance exa' +
          'mple river bank slope 2 1 rises 2 meters every 1 meter horizontal distance'
  },
  {
    id: 'glos_snap_points',
    title: 'Snap points',
    text: 'snap point intersection two grid lines drawing grid joints drawn snap points thus draw move joints s' +
          'tructural model mouse pointer automatically snaps nearest snap point grid lines actually visible loc' +
          'ations indicated marks vertical horizontal rulers located left bottom edges drawing board'
  },
  {
    id: 'hlp_bars_or_tubes',
    title: 'Solid bar or hollow tube ',
    text: 'optimize member properties design one important decisions make selection cross section type solid ba' +
          'r hollow tube member structural model making decision consider effect different cross sections membe' +
          'r strength tension compression compression members given material hollow tubes somewhat expensive so' +
          'lid bars dollars per kilogram compared solid bar mass though hollow tube provides much larger moment' +
          ' inertia thus hollow tube resists buckling efficiently solid bar compressive strength usually substa' +
          'ntially greater compression members increased compressive strength tube often outweighs increased co' +
          'st per kilogram usually economical use hollow tubes members carry load primarily compression tension' +
          ' members given material solid bars somewhat less expensive hollow tubes dollars per kilogram however' +
          ' tensile strength depends cross sectional area member moment inertia solid bar hollow tube mass also' +
          ' cross sectional area therefore tensile strength since solid bar costs less hollow tube offers stren' +
          'gth advantage tension solid bars usually better choice tension members usually economical use solid ' +
          'bars members carry load primarily tension'
  },
  {
    id: 'glos_span',
    title: 'Span',
    text: 'span bridge length support support'
  },
  {
    id: 'glos_standard_abutments',
    title: 'Standard abutments',
    text: 'bridge designer standard abutments substructure elements use simple supports hold bridge transmit we' +
          'ight soil'
  },
  {
    id: 'hlp_standard_truss',
    title: 'Standard truss configurations',
    text: 'truss bridge deck located top chord called deck truss truss bridge deck located bottom chord called ' +
          'truss number standard truss configurations commonly used bridge structures configurations defined pr' +
          'imarily geometry vertical diagonal members three common standard configurations pictured named 19th ' +
          'century engineers developed howe truss howe truss howe deck truss pratt truss pratt truss pratt deck' +
          ' truss warren truss warren truss warren deck truss regardless configuration trusses basic component ' +
          'parts'
  },
  {
    id: 'hlp_start_new_design',
    title: 'Start a new bridge design',
    text: 'start new bridge design click new design button main toolbar design project setup wizard displayed r' +
          'eview design requirement click next button participating local bridge design contest enter local con' +
          'test code click next button enter local contest code previous step site configuration automatically ' +
          'selected choose site configuration would like use click next button choose deck material determines ' +
          'deck thickness hence deck weight load configuration design based want use template choose one click ' +
          'next enter name project id title block click finish button notes tips chosen site configuration deck' +
          ' material load configuration click finish button return drawing board immediately selecting template' +
          ' filling title block optional make selections deck height support configuration deck material bridge' +
          ' corresponding site cost automatically calculated displayed near bottom design project setup wizard ' +
          'see detailed cost calculations click arrow right site cost display click finish button site design w' +
          'izard automatically create series joints level bridge deck satisfy requirements design specification' +
          ' 3.g abutments deck wearing surface water level displayed drawing board arch supports piers also cre' +
          'ated automatically included substructure configuration selected current design saved prompted save s' +
          'tart new design'
  },
  {
    id: 'hlp_strengthen_failed',
    title: 'Strengthen all unsafe members',
    text: 'design bridge go back one step go forward one step design successful members structural model determ' +
          'ined safe recent load test thus load test must strengthen members found unsafe determine members str' +
          'uctural model unsafe use either following two methods load test complete return drawing board look p' +
          'icture structural model member highlighted red unsafe compression member highlighted blue unsafe ten' +
          'sion members highlighted unsafe members structural model view two load test results columns right si' +
          'de member list member highlighted red unsafe compression member highlighted blue unsafe tension stre' +
          'ngthen unsafe member use either following two methods increase member size choose next larger member' +
          ' size run load test see larger member strong enough repeat process member passes load test use stron' +
          'ger material unsafe member carbon steel try changing high strength steel high strength steel try que' +
          'nched tempered steel run load test see increased strength new material sufficient use either method ' +
          'need change properties member notes tips two alternative methods better solution one produces requir' +
          'ed increase strength less increase cost generally increasing member size effective method far availa' +
          'ble member sizes materials member unsafe compression using stronger material may produce little incr' +
          'ease strength relatively slender members compressive strength dependent yield stress material change' +
          ' properties unsafe member example making larger red blue highlighting disappear necessarily mean mem' +
          'ber safe determine true status member modified must run load test'
  },
  {
    id: 'glos_structural_analysis',
    title: 'Structural analysis',
    text: 'structural analysis mathematical analysis structural model determine members forces resulting given ' +
          'set loads bridge designer uses structural analysis formulation called direct stiffness method'
  },
  {
    id: 'glos_structural_model',
    title: 'Structural model',
    text: 'structural model mathematical idealization actual structure model allows us predict actual structure' +
          ' behave loaded structural model truss following idealized characteristics composed members interconn' +
          'ected joints member connected exactly two joints one end joints assumed act like hinges hold members' +
          ' together prevent ends members rotating respect members carry axial force either compression tension' +
          ' bend loads applied structure joints supports placed joints'
  },
  {
    id: 'hlp_structural_stability',
    title: 'Structural stability',
    text: 'truss stable members interconnected rigid framework stability usually achieved ensuring truss compos' +
          'ed interconnected triangles example simple truss composed 6 joints 9 members together form four inte' +
          'rconnected triangles abf bcf cef cde member cf removed however truss becomes unstable without diagon' +
          'al member center panel truss consists rectangle bcef formed four members rather two triangles bcf ce' +
          'f configuration unstable nothing prevent rectangle bcef distorting parallelogram shown triangular ar' +
          'rangement members ensures truss structure rigid framework fix unstable truss look panel structural m' +
          'odel triangle add one members transform panel series interconnected triangular shapes notes tips tro' +
          'uble creating stable structural model try loading template using guide drawing joints members actual' +
          ' structure unstable collapse structural model unstable structural analysis mathematically impossible' +
          ' computer attempt divide zero. structural model unstable bridge designer detect attempt fix instabil' +
          'ity load test attempted fix unsuccessful bridge designer display warning message return drawing boar' +
          'd modify structural model eliminate instability though trusses composed interconnected triangles pos' +
          'sible one non triangular panels stable truss particularly true complex truss configurations trusses ' +
          'arch supports cases probably wont able tell whether truss stable looking ultimate test stability run' +
          ' load test load test runs without displaying structural model unstable warning truss stable'
  },
  {
    id: 'glos_substructure',
    title: 'Substructure',
    text: 'substructure foundation bridge consists abutments piers support bridge transmit weight earth'
  },
  {
    id: 'glos_supports',
    title: 'Supports',
    text: 'support joint structure attached foundation truss bridge two different types supports 1 pinned suppo' +
          'rts restrain horizontal vertical movement associated joint 2 roller supports restrain vertical movem' +
          'ent allow horizontal expansion structure'
  },
  {
    id: 'glos_symmetrical',
    title: 'Symmetrical',
    text: 'term symmetrical apply structure loading symmetrical structure left hand right hand sides structure ' +
          'exact mirror imges symmetrical loading loads applied either side bridge centerline identical'
  },
  {
    id: 'glos_template',
    title: 'Template',
    text: 'bridge designer template diagram depicting standard truss configuration load template displayed draw' +
          'ing board light grey dotted lines template show locate joints members create stable truss design'
  },
  {
    id: 'hlp_tensile_strength',
    title: 'Tensile strength',
    text: 'tensile strength member internal member force member becomes unsafe tension actual member force exce' +
          'eds tensile strength member may fail bridge designer tensile strength based yielding failure mode te' +
          'nsile strength represented symbol measured units force kilonewtons kn tensile strength calculated us' +
          'ing following equation f = 0.95 resistance factor member tension fy yield stress cross sectional are' +
          'a member notes tips equation taken 1994 aashto lrfd bridge design specifications obtain numerical va' +
          'lue fy given material given cross section member size click report member properties button bridge d' +
          'esigner calculates tensile strength member structural model load test tensile strength member always' +
          ' greater compressive strength member relatively long slender difference quite substantial'
  },
  {
    id: 'glos_tension',
    title: 'Tension',
    text: 'tension internal axial member force tends <<<lengthen>>> member'
  },
  {
    id: 'hlp_the_engineering',
    title: 'The engineering design process',
    text: 'engineering design process application math science technology create system component process meets' +
          ' human need practice engineering design really specialized form problem solving . consider simple 7 ' +
          'step problem solving process identify problem define problem develop alternative solutions analyze c' +
          'ompare alternative solutions select best alternative implement solution evaluate results civil engin' +
          'eers design bridge typically use process identify problem client hires team engineers design highway' +
          ' bridge cross river define problem engineers investigate proposed site work client determine exactly' +
          ' functional requirements bridge bridge located many lanes traffic required characteristics river wid' +
          'th depth current velocity river used ships wide navigable channel much overhead clearance vessels ne' +
          'ed owns land either side river sort soil rock located engineers also determine aesthetic requirement' +
          's structure perhaps importantly find much money client willing pay new bridge project budget develop' +
          ' alternative solutions engineers develop several alternative concept designs new bridge perhaps trus' +
          's arch suspension bridge analyze compare alternative solutions engineers analyze design alternative ' +
          'determine strengths weaknesses respect project requirements constraints identified step 2 also consi' +
          'der environmental impact constructibility proposed option select best alternative carefully analyzin' +
          'g alternatives engineers select one best satisfies project requirements present selection recommenda' +
          'tion client makes final decision implement solution client approved concept design team completes fi' +
          'nal design prepares plans specifications hands construction contractor build evaluate results end pr' +
          'oject engineers evaluate completed structure identify aspects project went well aspects could improv' +
          'ed ultimately observations help improve quality future projects design bridge bridge designer also f' +
          'ollow process identify problem project design truss bridge carry four lane highway across river defi' +
          'ne problem fully define understand problem carefully read design specifications familiarize characte' +
          'ristics project site develop alternative solutions achieve high quality design need investigate seve' +
          'ral different site configurations truss configurations analyze compare alternative solutions optimiz' +
          'e alternative configuration minimum cost compare results select best alternative select alternative ' +
          'costs least still passing load test implement solution finalize design record saving disk printing d' +
          'rawing printing copy load test results would like build test cardboard model design check learning a' +
          'ctivities manual available free website http //bridgecontest.org/resources/file folder bridges evalu' +
          'ate results think learned design process structural behavior designed bridge apply lessons improve e' +
          'fficiency effectiveness next design notes tips description specific procedures use design bridge bri' +
          'dge designer see design bridge'
  },
  {
    id: 'hlp_through_truss',
    title: 'The engineering design process',
    text: 'truss truss one deck located level bottom chord vehicles crossing truss bridge supported two main tr' +
          'usses'
  },
  {
    id: 'glos_through_truss',
    title: 'Through truss',
    text: 'truss truss deck located bottom chord truss vehicles truss pass two main trusses cross bridge'
  },
  {
    id: 'hlp_tip_of',
    title: 'Tip of the day',
    text: 'tip day dialog box provides hints help learn use bridge designer efficiently use programs advanced f' +
          'eatures optimize designs effectively tip day automatically displayed every time start program also v' +
          'iew clicking help menu selecting tip day notes tips want see tip day dialog box every time start pro' +
          'gram uncheck show tips startup box resume displaying tip day startup click help menu click tip day f' +
          'inally check show tips startup box'
  },
  {
    id: 'hlp_title_bar',
    title: 'Title bar',
    text: 'title bar rectangular area top bridge design window displays words bridge designer followed name cur' +
          'rent bridge design file notes tips bridge design window maximized move around screen clicking anywhe' +
          're title bar dragging window desired location'
  },
  {
    id: 'hlp_titleblock',
    title: 'Title block',
    text: 'title block located lower right hand corner drawing board shows name bridge design project name desi' +
          'gner project identification project id name designer optional provide shown title block included pri' +
          'nted output notes tips project id consists two parts separated dash first part six character local c' +
          'ontest code entered local contest code started design part project id cannot changed. second part op' +
          'tional name number helps identify design start new design design project setup wizard prompt designe' +
          'rs name project id want enter change designers name project id begun design click appropriate box ti' +
          'tle block cursor appears type edit desired text hide display title block using view title block butt' +
          'on member list displayed may hide part title block'
  },
  {
    id: 'hlp_toolbars',
    title: 'Toolbars',
    text: 'bridge design window includes four toolbars normally grouped two rows menu bar one free floating too' +
          'l palette together include controls need create test optimize record bridge design toolbars correspo' +
          'nding controls pictured described main toolbar new design button open file button save file button p' +
          'rint button drawing board button load test button select button delete button undo button redo butto' +
          'n go back button go forward button go iteration button status toolbar current cost report cost calcu' +
          'lations button current load test status report load test results button member properties toolbar me' +
          'mber properties lists increase member size button decrease member size button report member properti' +
          'es button display toolbar view member list button view rulers button view title block button view me' +
          'mber numbers button view symmetry guides button view template button grid resolution buttons palette' +
          's design tools animation controls'
  },
  {
    id: 'hlp_truss_bridges',
    title: 'Trusses and truss bridges',
    text: 'truss truss arrangement structural members connected together form rigid framework trusses members a' +
          'rranged interconnected triangles shown example result configuration truss members carry load primari' +
          'ly axial tension compression rigid carry load efficiently trusses able span large distances minimum ' +
          'material truss bridges trusses used extensively bridges since early 19th century early truss bridges' +
          ' made wood. classic american covered bridges trusses though wooden truss members covered walls roof ' +
          'protection elements later truss bridges made cast iron wrought iron modern trusses made structural s' +
          'teel truss bridges found many different configurations virtually basic component parts many types br' +
          'idges include beam bridges arches suspension bridges cable stayed bridges'
  },
  {
    id: 'hlp_undo',
    title: 'Undo button',
    text: 'click undo button undo recent change structural model notes tips undo button located main toolbar al' +
          'so accessed edit menu undo button works conjunction redo button'
  },
  {
    id: 'glos_unsafe',
    title: 'Unsafe',
    text: 'member unsafe internal member force exceeds strength member member unsafe tension maximum tension fo' +
          'rce exceeds tensile strength member unsafe compression maximum compression force exceeds compressive' +
          ' strength'
  },
  {
    id: 'hlp_old_style_graphics',
    title: 'Use old style graphics check box',
    text: 'cloud edition load test animation uses game quality high speed graphics let move around bridge teste' +
          'd see truck driver sees traverses bridge computers browsers support advanced graphics nothing happen' +
          's select load test animation computer misbehaves way one fix problem restarting bridge designer chec' +
          'king menu entry tools use old style graphics causes 3d load test animation shown using basic graphic' +
          's work computers notes tips newer computers running chromium based browsers like google chrome micro' +
          'soft edge support cloud edition graphics features firefox also works degradation features'
  },
  {
    id: 'hlp_using_undo',
    title: 'Using undo and redo',
    text: 'anytime make mistake creating editing structural model click undo button undo error mistakenly undo ' +
          'change structural model restore using redo button notes tips following actions undone draw joint dra' +
          'w member move joint change properties member delete erase joint delete erase member action undone al' +
          'so restored using redo bridge designer allows 100 levels undo undo 100 recent changes structural mod' +
          'el undo changes made current design iteration revert previous design iteration use go back button de' +
          'tailed explanation see whats difference go back undo'
  },
  {
    id: 'glos_verticals',
    title: 'Verticals',
    text: 'verticals truss members oriented vertically usually connect top bottom chords together'
  },
  {
    id: 'hlp_view_animation_controls',
    title: 'View animation controls button',
    text: 'click view animation controls button view menu display hide animation controls button functions togg' +
          'le. animation controls currently visible clicking button hide controls hidden clicking button displa' +
          'y notes tips wont able show animation controls drawing board use'
  },
  {
    id: 'hlp_view_tools',
    title: 'View design tools button',
    text: 'click view design tools button view menu display hide design tools palette button functions toggle. ' +
          'design tools palette currently visible clicking button hide palette hidden clicking button display n' +
          'otes tips wont able show design tools palette load test animation progress'
  },
  {
    id: 'hlp_view_member_list',
    title: 'View member list button',
    text: 'click view member list button display hide member list button functions toggle. member list currentl' +
          'y visible clicking button hide member list hidden clicking button display notes tips view member lis' +
          't button located display toolbar also accessed view menu member list also hidden view dragging right' +
          ' hand edge drawing board'
  },
  {
    id: 'hlp_view_member_numbers',
    title: 'View member numbers button',
    text: 'click view member numbers button display hide member numbers drawing board button functions toggle. ' +
          'member numbers currently visible clicking button hide member numbers hidden clicking button display ' +
          'notes tips view member numbers button located display toolbar also accessed view menu'
  },
  {
    id: 'hlp_view_rulers',
    title: 'View rulers button',
    text: 'click view rulers button display hide rulers button functions toggle. rulers currently visible click' +
          'ing button hide rulers hidden clicking button display notes tips view rulers button located display ' +
          'toolbar also accessed view menu hide rulers drawing board becomes slightly larger'
  },
  {
    id: 'hlp_view_symmetry',
    title: 'View symmetry guides button',
    text: 'click view symmetry guides button display hide set two vertical one horizontal guide lines drawing b' +
          'oard use guides drawing moving joints ensure structural model symmetrical guides moved dragging hand' +
          'les located left side horizontal guide bottom one vertical guide horizontal left hand vertical guide' +
          's positioned intersect particular joint intersection horizontal right hand vertical guides marks loc' +
          'ation symmetrical joint opposite side truss view symmetry guides button functions toggle. guides vis' +
          'ible clicking button hide guides hidden clicking button display notes tips view symmetry guides butt' +
          'on located display toolbar also accessed view menu view symmetry guides button available joint tool ' +
          'select tool active several site configurations pier located along centerline bridge cases optimal st' +
          'ructural design likely symmetrical'
  },
  {
    id: 'hlp_view_template',
    title: 'View template button',
    text: 'click view template button display hide current template drawing board button functions toggle. temp' +
          'late visible clicking button hide template hidden clicking button display notes tips view template b' +
          'utton located display toolbar also accessed view menu view template button enabled template loaded s' +
          'ee load display template information template always displayed behind structural model drawing board'
  },
  {
    id: 'hlp_view_title',
    title: 'View title block button',
    text: 'click view title block button display hide title block button functions toggle. title block currentl' +
          'y visible clicking button hide title block hidden clicking button display notes tips view title bloc' +
          'k button located display toolbar also accessed view menu computer low resolution monitor may find ti' +
          'tle block covers lower edge drawing grid case might need hide title block create edit structural mod' +
          'el'
  },
  {
    id: 'glos_wearing_surface',
    title: 'Wearing surface',
    text: 'wearing surface layer pavement material normally asphalt concrete placed top bridge deck protect dec' +
          'k damaged automobile traffic'
  },
  {
    id: 'hlp_not_realistic',
    title: 'What is',
    text: 'realistic bridge designer one purposes bridge designer provide realistic hands experience help under' +
          'stand civil engineers design real structures many aspects software accurately reflect structural des' +
          'ign process however number significant compromises made keep program getting complex bridge designer' +
          ' intended introduction engineering design emphasis design process rather detailed technical aspects ' +
          'structural design bottom line aspects bridge designer realistic important understand difference foll' +
          'owing aspects bridge designer accurately reflect process practicing civil engineers use design real ' +
          'bridges designing actual bridge engineers must developed detailed designs cost estimates abutments p' +
          'iers roadway deck complete three dimensional structural system including main trusses connections co' +
          'ncrete deck supporting steel framing many secondary members engineers would also need consider envir' +
          'onmental impact bridge effects water ice river channel integral part design bridge designer design m' +
          'ain trusses make preliminary decisions configurations roadway supports design strictly two dimension' +
          'al thus account three dimensional stability designing actual bridge engineers must consider effects ' +
          'fatigue tendency structural material fail prematurely result repetitive loading caused vehicular tra' +
          'ffic bridge designer consider fatigue designing actual bridge engineers must consider many different' +
          ' types loading include several different forms vehicular loads self weight wind snow collision vehic' +
          'les ships earthquakes must consider longitudinal lateral position vehicular loads bridge deck must a' +
          'lso consider numerous load combinations eleven 1994 aashto bridge design specification bridge design' +
          'er considers two types vehicular loading self weight bridge considers longitudinal position vehicula' +
          'r loading lateral position designing actual bridge engineers must consider limitations deflections a' +
          'mount bending occurs vehicle crosses bridge bridge designer calculates deflections displays load tes' +
          't use design criterion designing actual bridge engineers must consider many additional member failur' +
          'e modes considered bridge designer bridge designer load test aashto truck loading represents two lan' +
          'es highway traffic loading moved across bridge one direction left right aashto loading heavy rear ax' +
          'le lighter front axle loading asymmetrical optimally designed bridge might asymmetrical well however' +
          ' design real bridges must consider movement aashto loading directions left right right left result o' +
          'ptimally designed real world bridges generally symmetrical though bridge designer attempts accuratel' +
          'y demonstrate cost tradeoffs inherent engineering design actual costs structural materials component' +
          's used software intended accurate designing actual bridge engineers must consider esthetics bridge d' +
          'esigner include esthetics design criterion though certainly set personal goal design good looking br' +
          'idges important recognize limitations exist equally important understand realistic bridge designer'
  },
  {
    id: 'hlp_design_iteration',
    title: 'What is a design iteration ',
    text: 'anytime make one changes structural model run load test performed one design iteration bridge design' +
          'er saves design iterations created current session provides capability revert previous iterations ti' +
          'me session notes tips revert previous design iteration click go back button go iteration button curr' +
          'ent design iteration number always displayed main toolbar number incremented start new iteration whe' +
          'never make first change structural model load test design iteration numbers never duplicated design ' +
          'iterations never overwritten even revert previous iteration example suppose working design iteration' +
          ' 10 decide go back iteration 6 design iteration number displayed main toolbar change 10 6 accordingl' +
          'y soon make change structural model design iteration number update 11 since initiated new iteration ' +
          'way previous iterations 6 7 8 9 10 preserved future use see design iterations related using tree vie' +
          'w tab reverting previous design iteration particularly useful optimizing design optimization process' +
          ' never linear always marked dead ends unexpected outcomes attempts optimization successful others un' +
          'successful attempt simply revert previous successful design iteration try previous design iterations' +
          ' preserved end current session start new design exit bridge designer previous iterations deleted thu' +
          's design iteration browser display iterations created current session'
  },
  {
    id: 'hlp_realistic',
    title: 'What is realistic about the bridge designer ',
    text: 'one purposes bridge designer provide realistic hands experience help understand civil engineers desi' +
          'gn real structures many aspects software accurately reflect structural design process however number' +
          ' significant compromises made keep program getting complex bridge designer intended introduction eng' +
          'ineering design emphasis design process rather detailed technical aspects structural design bottom l' +
          'ine aspects bridge designer realistic important understand difference following aspects bridge desig' +
          'ner reflect reasonable accuracy nature engineering design process practicing civil engineers use des' +
          'ign real bridges design open ended process real world design problems always many possible solutions' +
          ' bridge designer demonstrates aspect design process allowing much freedom developing configuration b' +
          'ridge though design open ended process always constrained real world conditions restrictions bridge ' +
          'designer demonstrates aspect design process limiting design specific span lengths support configurat' +
          'ions conform conditions project site limiting choices available materials member types imposing requ' +
          'irement minimize cost design inherently iterative process engineers usually work incomplete informat' +
          'ion must often make assumptions subsequently check revise assumptions design process progresses. dev' +
          'eloping high quality solution always requires engineer consider many different design alternatives u' +
          'ltimately select best one bridge designer clearly demonstrates aspect design process impossible achi' +
          'eve truly optimal bridge design without considering many different alternative truss configurations ' +
          'materials cross sections member sizes design always involves trade offs usually possible find single' +
          ' design solution best satisfies design criteria making improvements one area often causes unexpected' +
          ' problems somewhere else experience many trade offs use bridge designer example attempt optimize des' +
          'ign discover reducing depth truss causes cost verticals diagonals decrease get shorter also causes c' +
          'ost top bottom chords increase member force increases larger member sizes needed preserve structural' +
          ' safety real world structural design need find optimum balance two competing criteria structural eng' +
          'ineering design regulated use codes codes ensure engineering practiced consistent safe manner throug' +
          'hout country region municipality separate industry standard codes governing design steel concrete wo' +
          'od structures regional local building codes specify design loads fire protection standards many requ' +
          'irements designing buildings design highway bridges us governed aashto bridge design specification b' +
          'ridge designer load test uses standard slightly modified aashto truck loading compressive tensile st' +
          'rengths members computed exactly specified aashto specification structures generally designed safely' +
          ' carry one code specified loadings minimizing cost also often important objective never important st' +
          'ructural safety. cost reductions never made reductions compromise structural safety formulation brid' +
          'ge designer based relationship safety cost bridge designer design objective minimize cost design nev' +
          'er valid fails load test structural design often characterized trade offs material cost fabrication ' +
          'cost construction cost structure designed minimize material cost design often include many different' +
          ' member types sizes variety member sizes makes harder therefore expensive cut fit members fabricatio' +
          'n actually assemble job site construction structural designers usually attempt achieve degree standa' +
          'rdization selection structural elements even means designing resulting increase material cost usuall' +
          'y offset savings fabrication construction costs bridge designer cost calculation simulates trade rea' +
          'sonable authenticity modern structural engineering practice structural analysis generally performed ' +
          'using computer based method called matrix structural analysis specifically direct stiffness method b' +
          'ridge designer uses method compute member forces load test thats good news also important recognize ' +
          'bad news realistic bd'
  },
  {
    id: 'hlp_whats_new',
    title: `What's new in the cloud edition `,
    text: 'welcome welcome cloud edition bridge designer millions users since 2002 bridge designer one successf' +
          'ul educational software technologies world new edition update designed enable bridge designer learni' +
          'ng anyone access web browser get started right introductory engineering experience working alone tea' +
          'm team teacher new features please enjoy checking possibilities.. installation required bridge desig' +
          'ner works recent versions browsers hit web site chrome firefox edge updated 2024 later recommended e' +
          'xport 3d model design addition beautiful blueprint style printed version bridge long part bridge des' +
          'igner export stl file suitable input favorite 3d printer late updates previous bridge designer versi' +
          'ons still 3d walk completed bridges walk fly around animation completed bridge observe performance t' +
          'ruck load drives deck member details interactive member details explorer supplements members list dy' +
          'namically updated engineering information member cross sections materials lengths costs deep undo li' +
          'mit 5 100 undo redo last hundred edits current design iteration iterations tree view track design it' +
          'erations view graphically shows history one click drag member list selections click drag select grou' +
          'p members member list'
  },
  {
    id: 'hlp_undo_vs_go_back',
    title: `What's the difference between undo and go back `,
    text: 'first glance go back button undo button might appear performing function practice two functions clos' +
          'ely related important distinctions two use undo correct mistakes make working current design iterati' +
          'on use go back revert previous design iteration go back function normally used part optimization pro' +
          'cess rather correct drawing editing errors undo available 100 recent changes structural model go bac' +
          'k previous design iteration created current session undo applies current design iteration undo funct' +
          'ion disabled whenever go back previous iteration undo enabled soon make new changes structural model'
  },
  {
    id: 'glos_yield_stress',
    title: 'Yield stress',
    text: 'yield stress strength metal force per unit area metal fails yielding'
  },
  {
    id: 'glos_yielding',
    title: 'Yielding',
    text: 'yielding one possible failure mode member made metal metallic material fails yielding undergoes larg' +
          'e deformations i.e. stretches without able carry additional load'
  },
];
