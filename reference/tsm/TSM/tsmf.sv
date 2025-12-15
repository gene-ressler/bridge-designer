def O (0,0,0)
def F 1
def N 0.3
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

def frustumNonly {
  {nearPlane}
  {farPlane}
  dots [dotsize=1.1pt,lay=over] (ptN)
  line [flatOpts] (nearNE)(farNE)
  line [flatOpts] (nearNW)(farNW)
  line [flatOpts] (nearSW)(farSW)
  line [flatOpts] (nearSE)(farSE)
}

def frustum {
  {frustumNonly}
%  line 
%       ((ptF)'x + tic, (ptF)'y, (ptF)'z + eps) 
%       ((ptF)'x - tic, (ptF)'y, (ptF)'z + eps)
%  line
%       ((ptF)'x, (ptF)'y + tic, (ptF)'z + eps) 
%       ((ptF)'x, (ptF)'y - tic, (ptF)'z + eps)
%  line
%       ((ptN)'x + tic, (ptN)'y, (ptN)'z + eps) 
%       ((ptN)'x - tic, (ptN)'y, (ptN)'z + eps)
%  line
%       ((ptN)'x, (ptN)'y + tic, (ptN)'z + eps) 
%       ((ptN)'x, (ptN)'y - tic, (ptN)'z + eps)
}

def topEx (nearSW)
def botEx (farNE)

def orientFrustum 
  scale(6) then 
  view( (2.5,3,5), (0,0,0), [0,1,0] )

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

def orientedFrustum put { [[orientFrustum]] } {frustumNonly}

def figT {
  {orientedFrustum}
  dots [dotsize=1.1pt,lay=over] (ptFproj) 
  % frustum axis
  put { [[orientFrustum]] }  line (0,0,0) (0,0,-F*1.2)
  % unit axis vector
  line[line style=->,line width=1pt] (ptNproj) (vecAtip)
  special|
    \coordinate [label=290:\scriptsize$N$] (N) at #1;
    \coordinate [label=290:\scriptsize$F$] (F) at #2;
    \coordinate [label=175:\scriptsize$\vec{a}$] (a) at #3;
  |(ptNproj)(ptFproj)(vecAtip)
}

def frustumHull {
  put { [[orientFrustum]] }
  { polygon [lay=over,fill=none,line width=1pt] 
    (farNW) (nearNW) (nearSW) 
    (nearSE) (farSE) (farNE) }
}

def farNWproj (farNW) then [[projectFrustum]]
def nearNWproj (nearNW) then [[projectFrustum]]
def nearSWproj (nearSW) then [[projectFrustum]]
def nearSEproj (nearSE) then [[projectFrustum]]
def farSEproj (farSE) then [[projectFrustum]]
def farNEproj (farNE) then [[projectFrustum]]

def farNWonBase  (ptNproj) + ([vecA] . ((farNWproj)  - (ptNproj))) * [vecA]
def nearNWonBase (ptNproj) + ([vecA] . ((nearNWproj) - (ptNproj))) * [vecA]
def nearSWonBase (ptNproj) + ([vecA] . ((nearSWproj) - (ptNproj))) * [vecA]
def nearSEonBase (ptNproj) + ([vecA] . ((nearSEproj) - (ptNproj))) * [vecA]
def farSEonBase  (ptNproj) + ([vecA] . ((farSEproj)  - (ptNproj))) * [vecA]
def farNEonBase  (ptNproj) + ([vecA] . ((farNEproj)  - (ptNproj))) * [vecA]
 
def projOpts [line style=dashed]

def figU {
  put { [[orientFrustum]] } {frustumNonly}
  % {orientedFrustum}
  {frustumHull}
  % frustum axis
  put { [[orientFrustum]] }  line (0,0,0) (0,0,-F*1.8)
  line [projOpts] (farNWonBase)  (farNWproj)
  line [projOpts] (nearNWonBase) (nearNWproj)
  % line [projOpts] (nearSWonBase) (nearSWproj)
  line [projOpts] (nearSEonBase) (nearSEproj)
  line [projOpts] (farSEonBase)  (farSEproj)
  % line [projOpts] (farNEonBase)  (farNEproj)
  def botTopOpts [line style=solid]
  line [botTopOpts] (topLft) (topRgt)
  line [botTopOpts] (botLft) (botRgt)
  dots [dotsize=1.1pt] (nearSWonBase) (farNEonBase)
  special|
    \coordinate [label=90:\scriptsize$N$] (N) at #1;
    \coordinate [label=-90:{\makebox[0pt][l]{\scriptsize top line}}] (top) at #2;
    \coordinate [label=-90:{\makebox[0pt][l]{\scriptsize bottom line}}] (bot) at #3;
  |(ptNproj)(topRgt)(botRgt)
}

def figNotUsed {
  {orientedFrustum}
  % frustum axis
  put { [[orientFrustum]] }  line (0,0,qFromN*1.2) (0,0,-F*2)
  % Point Q
  dots [dotsize=1.1pt] (qProj) 
  special|
    \coordinate [label=-45:\scriptsize$Q$] (Q) at #1;
    \coordinate [label=-90:{\makebox[0pt][l]{\scriptsize top line}}] (top) at #2;
    \coordinate [label=-90:{\makebox[0pt][l]{\scriptsize bottom line}}] (bot) at #3;
  |(qProj)(topRgt)(botRgt)
}

def notExtOpts [line style=dashed]

def L (farNW)
def R (farSE)

def figV {
  {orientedFrustum}
  {frustumHull}
  line[line style=->,line width=1pt] (ptNproj) (vecAtip)
  put { [[orientFrustum]] } {
    dots [dotsize=1.1pt] (Q)
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
    \coordinate [label=175:\scriptsize$\vec{a}$] (a) at #2;
  |(qProj)(vecAtip)
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

def figW {
  {orientedFrustum}
  %{frustumHull}
  dots [dotsize=1.1pt,lay=over] (qProj)
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
  <U> {figU}
  <V> {figV}
  <W> {figW}
  <> {figT}

def dx 7
def dy -7

def all {
  put { translate([0 * dx, 0 * dy]) } {figT}
  put { translate([1 * dx, 0 * dy]) } {figU}
  put { translate([0 * dx, 1 * dy]) } {figV}
  put { translate([1 * dx, 1 * dy]) } {figW}
}

def scene 
  <onepage> {all}
  <> {fig}

{scene}

global {
  language tikz
  set [cull=false,line width=0.2pt,>=latex] 
}
