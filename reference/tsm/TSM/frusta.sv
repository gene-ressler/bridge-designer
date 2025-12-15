def O (0,0,0)
def F 1
def N 0.25
def theta 20
def aspect 0.7
def wHalf sin(theta) / cos(theta) * F
def hHalf wHalf * aspect 
def farNE ( wHalf,  hHalf, -F)
def farNW (-wHalf,  hHalf, -F)
def farSW (-wHalf, -hHalf, -F)
def farSE ( wHalf, -hHalf, -F)
def ptF (farSW) + ( (farNE) - (farSW) ) / 2
def s scale(N/F)
def nearNE [[s]] * (farNE)
def nearNW [[s]] * (farNW)
def nearSW [[s]] * (farSW)
def nearSE [[s]] * (farSE)
def ptN (nearSW) + ( (nearNE) - (nearSW) ) / 2
def planeOpts [color=lightgray,fill=lightgray!50,fill opacity=0.5]
def farPlane polygon[planeOpts] (farNE)(farNW)(farSW)(farSE)
def nearPlane polygon[planeOpts] (nearNE)(nearNW)(nearSW)(nearSE) 
def tic 0.02
def eps 1e-4
def qFromN 0.42
def flatOpts [color=lightgray]

def frustum {
  {nearPlane}
  {farPlane}
  line 
       ((ptF)'x + tic, (ptF)'y, (ptF)'z + eps) 
       ((ptF)'x - tic, (ptF)'y, (ptF)'z + eps)
  line
       ((ptF)'x, (ptF)'y + tic, (ptF)'z + eps) 
       ((ptF)'x, (ptF)'y - tic, (ptF)'z + eps)
  line
       ((ptN)'x + tic, (ptN)'y, (ptN)'z + eps) 
       ((ptN)'x - tic, (ptN)'y, (ptN)'z + eps)
  line
       ((ptN)'x, (ptN)'y + tic, (ptN)'z + eps) 
       ((ptN)'x, (ptN)'y - tic, (ptN)'z + eps)
  line [flatOpts] (nearNE)(farNE)
  line [flatOpts] (nearNW)(farNW)
  line [flatOpts] (nearSW)(farSW)
  line [flatOpts] (nearSE)(farSE)
}

def topEx (nearSW)
def botEx (farNE)

def orientFrustum 
  scale(5) then 
  view( (2.5,3.8,5), (0,0,0), [0,1,0] )

def projectFrustum 
  [[orientFrustum]] then 
  scale([1,1,eps]) then 
  translate([0,0,10])

def ptFproj (ptF) then [[projectFrustum]]
def ptNproj (ptN) then [[projectFrustum]]
def topExProj (topEx) then [[projectFrustum]]
def botExProj (botEx) then [[projectFrustum]]
def Q (0,0,qFromN-N)
def qProj (Q) then [[projectFrustum]]

% Unit axis vector.
def vecA unit((ptFproj) - (ptNproj))
def vecAperp [-[vecA]'y, [vecA]'x, [vecA]'z]
def vecAtip (ptNproj) + [vecA]

def tTopEx ((topExProj) - (ptNproj)) . [vecA]
def tBotEx ((botExProj) - (ptNproj)) . [vecA]

def ptTopEx (ptNproj) + tTopEx * [vecA]
def ptBotEx (ptNproj) + tBotEx * [vecA]
def topHalfLen .5
def botHalfLen 2.2
def topLft (ptTopEx) + [vecAperp] * topHalfLen
def topRgt (ptTopEx) - [vecAperp] * topHalfLen
def botLft (ptBotEx) + [vecAperp] * botHalfLen
def botRgt (ptBotEx) - [vecAperp] * botHalfLen

def orientedFrustum put { [[orientFrustum]] } {frustum}

def figA {
  {orientedFrustum}
  % frustum axis
  put { [[orientFrustum]] }  line (0,0,qFromN*1.2) (0,0,-F*2)
  % unit axis vector
  line[line style=->,line width=1pt] (ptNproj) (vecAtip)
  special|
    \coordinate [label=290:\scriptsize$N$] (N) at #1;
    \coordinate [label=290:\scriptsize$F$] (F) at #2;
    \coordinate [label=190:\scriptsize$\vec{a}$] (a) at #3;
  |(ptNproj)(ptFproj)(vecAtip)
}

def botTopOpts [line style=dashed]

def figB {
  {orientedFrustum}
  % frustum axis
  put { [[orientFrustum]] }  line (0,0,qFromN*1.2) (0,0,-F*2)
  line [botTopOpts] (topLft) (topRgt)
  line [botTopOpts] (botLft) (botRgt)
  % Point Q
  dots [dotsize=2pt] (qProj) 
  special|
    \coordinate [label=-45:\scriptsize$Q$] (Q) at #1;
    \coordinate [label=-90:{\makebox[0pt][l]{\scriptsize top line}}] (top) at #2;
    \coordinate [label=-90:{\makebox[0pt][l]{\scriptsize bottom line}}] (bot) at #3;
  |(qProj)(topRgt)(botRgt)
}

def notExtOpts [line style=dashed]

def frustumHull {
  put { [[orientFrustum]] }
  { polygon [lay=over,fill=none,line width=1pt] 
    (farNW) (nearNW) (nearSW) 
    (nearSE) (farSE) (farNE) }
}

def L (farNW)
def R (farSE)

def figC {
  {orientedFrustum}
  {frustumHull}
  put { [[orientFrustum]] } {
    dots [dotsize=2pt] (Q)
    % line [notExtOpts] (Q) (nearNE)
    line [notExtOpts] (Q) (nearNW)
    line [notExtOpts] (Q) (nearSE)
    line [notExtOpts] (Q) (nearSW)    
    line [notExtOpts] (Q) (farNE)
    line (Q) (L)
    line (Q) (R)
    % line [notExtOpts] (Q) (farSW)
  }
  special|
    \coordinate [label=-45:\scriptsize$Q$] (Q) at #1;
  |(qProj)
}

def Lproj (L) then [[projectFrustum]]
def Rproj (R) then [[projectFrustum]]
def uL unit((Lproj) - (qProj))
def uR unit((Rproj) - (qProj))

def qToNdist | (ptNproj) - (qProj) |
def tB qToNdist + tBotEx
def tT qToNdist + tTopEx 

def P_TL (qProj) + tT / ([uL] . [vecA]) * [uL]
def P_BL (qProj) + tB / ([uL] . [vecA]) * [uL]
def P_TR (qProj) + tT / ([uR] . [vecA]) * [uR]
def P_BR (qProj) + tB / ([uR] . [vecA]) * [uR]

def figD {
  {orientedFrustum}
  %{frustumHull}
  dots [dotsize=2pt,lay=over] (qProj)
  polygon [fill=none,lay=over,line width=1pt] (P_TL)(P_BL)(P_BR)(P_TR)
  line [notExtOpts] (P_TR) (qProj) (P_TL) 
  special|
    \coordinate [label=-45:\scriptsize$Q$] (Q) at #1;
    \coordinate [label=180:\scriptsize$P_{TL}$] (Ptl) at #2;
    \coordinate [label=180:\scriptsize$P_{BL}$] (Pbl) at #3;
    \coordinate [label=-60:\scriptsize$P_{TR}$] (Ptr) at #4;
    \coordinate [label=-60:\scriptsize$P_{BR}$] (Pbr) at #5;
  |(qProj)(P_TL)(P_BL)(P_TR)(P_BR)
}

def fig
  <V> {figB}
  <W> {figC}
  <X> {figD}
  <> {figA}

def dx 7
def dy -7

def all {
  put { translate([0 * dx, 0 * dy]) } {figA}
  put { translate([1 * dx, 0 * dy]) } {figB}
  put { translate([0 * dx, 1 * dy]) } {figC}
  put { translate([1 * dx, 1 * dy]) } {figD}
}

def scene 
  <onepage> {all}
  <> {fig}

{scene}

global {
  language tikz
  set [cull=false,line width=0.2pt,>=latex] 
}
