def p0 (2, 1)  
def p1 (4, 0)
def p2 (7, 1)
def p3 (0, 4.5)

def eps 1e-3
def tic .06

def axes put { translate([0,0,2*eps]) } {
  def x1 8
  def y1 5.75
  special|
    \coordinate [label=below:$x$] (X) at #1;
    \coordinate [label=left:$y$] (Y) at #2;
  |(x1,0)(0,y1)
  line [line style=->, line width=1pt] (-.25,0)(x1,0)
  line [line style=->, line width=1pt] (0,-.25)(0,y1)
}

def posx_tic {
  put { translate([0,0,2*eps]) } {
    line [line width=1pt] (1,tic)(1,-tic)
  }
}

def posy_tic {
  put { translate([0,0,2*eps]) } {
    line [line width=1pt] (tic,1)(-tic,1)
  }
}

def negx_tic {
  put { translate([0,0,2*eps]) } {
    line [line width=1pt] (-1,tic)(-1,-tic)
  }
}

def negy_tic {
  put { translate([0,0,2*eps]) } {
    line [line width=1pt] (tic,-1)(-tic,-1)
  }
}

def sym_axes put { translate([0,0,3*eps]) } {
  def x1 3.5
  def y1 3.5
  special|
    \coordinate [label=below:$x$] (X) at #1;
    \coordinate [label=left:$y$] (Y) at #2;
  |(x1,0)(0,y1)
  line [line style=->, line width=1pt] (-2.75,0)(x1,0)
  line [line style=->, line width=1pt] (0,-6.5)(0,y1)
}

def longy_axes put { translate([0,0,2*eps]) } {
  def x1 3.5
  def y1 3.5
  special|
    \coordinate [label=below:$x$] (X) at #1;
    \coordinate [label=left:$y$] (Y) at #2;
  |(x1,0)(0,y1)
  line [line style=->, line width=1pt] (-.25,0)(x1,0)
  line [line style=->, line width=1pt] (0,-6.5)(0,y1)
}

def front [fill=green]
def middle [fill=yellow]
def rear [fill=red]

def trapezoid {
  polygon [fill=none,line width=0.75pt] (p0)(p1)(p2)(p3)
  put { translate([0,0,eps]) } {
    polygon [front] (p0)(2,2)(2-2/3.5,2)
    polygon [front] (p0)(3,.5)(3,1)
    polygon [front] (p1)(5,1/3)(5,1)(4,1)
    polygon [middle] (1,3)(1, 1 + 3.5/2)(2 - 2 * 2/3.5, 3)
    polygon [middle] (2,3)(2,2)(3,2)(3,3)
    polygon [middle] (3,1)(4,1)(4,2)(3,2)
    polygon [rear] (p3)(.5 * 2/3.5,4)(1,4)
    polygon [rear] (1,4)(1,3)(2,3)(2,3.5)
    polygon [rear] (4,2.5)(4,2)(5,2)
    polygon [rear] (5,1)(6,1)(6,1.5)(5,2)
    polygon [rear] (6,2/3)(7,1)(6,1)
  }
}

def figA {
  {axes}
  put { translate([0,0,-eps]) } {trapezoid}
  special|
    \coordinate [label=225:\scriptsize$P_0$] (p0) at #1;
    \coordinate [label=270:\scriptsize$P_1$] (p1) at #2;
    \coordinate [label=000:\scriptsize$P_2$] (p2) at #3;
    \coordinate [label=180:\scriptsize$P_3$] (p3) at #4;
  |(p0)(p1)(p2)(p3)
  repeat { 8, translate([1,0]) } line (0,0)(0,5)
  repeat { 6, translate([0,1]) } line (0,0)(7,0)
}

def T1 translate([-(p0)'x, -(p0)'y])
def TB [[T1]]
def p0B [[TB]] * (p0)
def p1B [[TB]] * (p1) % needed
def p2B [[TB]] * (p2)
def p3B [[TB]] * (p3)

def figB {
  {axes}
  put { [[TB]] } {trapezoid}
  special|
    \coordinate [label=225:\scriptsize$B_0$] (p0B) at #1;
    \coordinate [label=270:\scriptsize$B_1$] (p1B) at #2;
    \coordinate [label=-60:\scriptsize$B_2$] (p2B) at #3;
    \coordinate [label=180:\scriptsize$B_3$] (p3B) at #4;
  |(p0B)(p1B)(p2B)(p3B)
}

def R1 rotate(-atan2((p1B)'y, (p1B)'x))
def TC [[R1]] * [[TB]] 
def p0C [[TC]] * (p0)
def p1C [[TC]] * (p1) 
def p2C [[TC]] * (p2)
def p3C [[TC]] * (p3) % needed

def figC {
  {axes}
  put { [[TC]] } {trapezoid}
  special|
    \coordinate [label=225:\scriptsize$C_0$] (p0C) at #1;
    \coordinate [label=270:\scriptsize$C_1$] (p1C) at #2;
    \coordinate [label=000:\scriptsize$C_2$] (p2C) at #3;
    \coordinate [label=180:\scriptsize$C_3$] (p3C) at #4;
  |(p0C)(p1C)(p2C)(p3C)
}

def V1 [
[1, -(p3C)'x / (p3C)'y, 0, 0]
[0,                  1, 0, 0]
[0,                  0, 1, 0]
[0,                  0, 0, 1]
]
def TD [[V1]] * [[TC]]
def p0D [[TD]] * (p0)
def p1D [[TD]] * (p1) % x needed
def p2D [[TD]] * (p2) % x needed
def p3D [[TD]] * (p3)

def figD {
  {axes}
  put { [[TD]] } {trapezoid}
  special|
    \coordinate [label=225:\scriptsize$D_0$] (p0D) at #1;
    \coordinate [label=270:\scriptsize$D_1$] (p1D) at #2;
    \coordinate [label=000:\scriptsize$D_2$] (p2D) at #3;
    \coordinate [label=180:\scriptsize$D_3$] (p3D) at #4;
  |(p0D)(p1D)(p2D)(p3D)
}

def d   (p1D)'x * (p2C)'y / ((p2D)'x - (p1D)'x)
def T2 translate([0, d, 0])
def TE [[T2]] * [[TD]]
def p0E [[TE]] * (p0)
def p1E [[TE]] * (p1)
def p2E [[TE]] * (p2) % needed
def p3E [[TE]] * (p3)

def figE {
  {axes}
  put { [[TE]] } {trapezoid}
  line [line style=dashed] (0,0)(p1E)
  special|
    \coordinate [label=180:\scriptsize$E_0$] (p0E) at #1;
    \coordinate [label=270:\scriptsize$E_1$] (p1E) at #2;
    \coordinate [label=000:\scriptsize$E_2$] (p2E) at #3;
    \coordinate [label=180:\scriptsize$E_3$] (p3E) at #4;
  |(p0E)(p1E)(p2E)(p3E)
}

def fudge 2.5
def Fudge scale([fudge, fudge, 1])
def invFudge scale([1/fudge, 1/fudge, 1])
def S1 scale([ 1 / (p2E)'x, 1 / (p2E)'y, 1])
def TF [[Fudge]] * [[S1]] * [[TE]] 
def p0F [[TF]] * (p0)
def p1F [[TF]] * (p1)
def p2F [[TF]] * (p2) 
def p3F [[TF]] * (p3)

def figF {
  {axes} put { [[Fudge]] } { {posx_tic} {posy_tic} }
  put { [[TF]] } {trapezoid}
  line [line style=dashed] (0,0)(p1F)
  special|
    \coordinate [label=180:\scriptsize$F_0$] (p0F) at #1;
    \coordinate [label=000:\scriptsize$F_1$] (p1F) at #2;
    \coordinate [label=000:{\scriptsize$F_2(1,1)$}] (p2F) at #3;
    \coordinate [label=180:\scriptsize$F_3$] (p3F) at #4;
  |(p0F)(p1F)(p2F)(p3F)
}

def P [
  [1, 0, 0, 0]
  [0, 1, 0,-1]
  [0, 0, 1, 0]
  [0, 1, 0, 0]
]

def TG [[Fudge]] * [[P]] * [[invFudge]] * [[TF]]
def p0G [[TG]] * (p0)
def p1G [[TG]] * (p1)
def p2G [[TG]] * (p2) 
def p3G [[TG]] * (p3)

def figG {
  {longy_axes} put { [[Fudge]] } { {posx_tic} {posy_tic} {negy_tic} }
  put { [[TG]] } {trapezoid}
  special|
    \coordinate [label=180:\scriptsize$G_0$] (p0G) at #1;
    \coordinate [label=  0:\scriptsize$G_1$] (p1G) at #2;
    \coordinate [label= 90:{\scriptsize$G_2\makebox[0pt][l]{(1,0)}$}] (p2G) at #3;
    \coordinate [label=135:\scriptsize$G_3$] (p3G) at #4;
  |(p0G)(p1G)(p2G)(p3G)
}

def ST [
  [ 2,                     0, 0, -1 ]
  [ 0, 2 * d / ((p2E)'y - d), 0,  1 ] 
  [ 0,                     0, 1,  0 ]
  [ 0,                     0, 0,  1 ]
]

def TH [[Fudge]] * [[ST]] * [[invFudge]] * [[TG]]
def p0H [[TH]] * (p0)
def p1H [[TH]] * (p1)
def p2H [[TH]] * (p2) 
def p3H [[TH]] * (p3)

def figH {
  {sym_axes}
  put { [[Fudge]] } { {posx_tic} {posy_tic} {negx_tic} {negy_tic} }
  put { [[TH]] } {trapezoid}
  special|
    \coordinate [label=270:{\scriptsize$H_0(-1,-1)$}] (p0H) at #1;
    \coordinate [label=  0:{\scriptsize$H_1$}]        (p1H) at #2;
    \coordinate [label= 90:{\scriptsize$H_2(1,1)$}]   (p2H) at #3;
    \coordinate [label=180:{\scriptsize$H_3$}]        (p3H) at #4;
  |(p0H)(p1H)(p2H)(p3H)
}

def cc  14
def dd -8

def all {
  put { translate([0 * cc, 0 * dd]) } {figA}
  put { translate([0 * cc, 1 * dd]) } {figB}
  put { translate([0 * cc, 2 * dd]) } {figC}
  put { translate([0 * cc, 3 * dd]) } {figD}
  put { translate([0 * cc, 4 * dd]) } {figE}
  put { translate([1 * cc, 0 * dd]) } {figF}
  put { translate([1 * cc, 1 * dd]) } {figG}
  put { translate([1 * cc, 3 * dd]) } {figH}
}

def fig
  <B> put { translate([0 * cc, 1 * dd]) } {figB}
  <C> put { translate([0 * cc, 2 * dd]) } {figC}
  <D> put { translate([0 * cc, 3 * dd]) } {figD}
  <E> put { translate([0 * cc, 4 * dd]) } {figE}
  <F> put { translate([1 * cc, 0 * dd]) } {figF}
  <G> put { translate([1 * cc, 1 * dd]) } {figG}
  <H> put { translate([1 * cc, 3 * dd]) } {figH}
  <> put { translate([0 * cc, 0 * dd]) } {figA}

def scene 
  <onepage> put { scale(.5) } {all}
  <> put { scale(.5) } {fig}

{scene}

global {
  language tikz
  set [cull=false,line width=0.2pt,>=latex] 
}
