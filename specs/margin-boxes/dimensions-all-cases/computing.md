A generated (auto size) // B, C not generated
<=> B, C { size: 0; flex-grow: 0!important; } 

A generated (sizeA) // B, C not generated
<=> { size: <sizeA>; flex-grow: 0; } 



## 2 generated

A auto-size  
B auto-size  
<=>  
A, B, C { size: 33% }


A auto-size  
B sizeB  
<=>  
A, C { size: (100% - sizeB)/2 }  
B { size : sizeB }

A auto-size  
C auto-size  
<=>  
A, C { size: 50% }

A auto-size  
C sizeC  
<=>  
A { size: 100% - sizeC }  
C { size: sizeC }

A sizeA   
B auto-size  
<=>  
A, C { size: sizeA }  
B { size: 100% - (sizeA*2) }

A sizeA   
B sizeB  
<=>  
A { size: sizeA }  
B { size: sizeB }  
C { 100% - sizeA - sizeB }

A sizeA  
C auto-size  
<=>  
A { size: sizeA }  
C { 100% - sizeA }


A sizeA  
C sizeC  
<=>  
A { size: sizeA }  
B { size: 100% - sizeA - sizeB }  
C { size: sizeC }

B auto-size  
C auto-size  
<=>
A, B, C { size: 33% }

B auto-size
C sizeC
<=>
B { 100% - (sizeC*2)}
A, C  { size: sizeC }

B sizeB
C auto-size
<=>
B { size: sizeB }
A, C { size: (100% - sizeB)/2}

B sizeB
C sizeC
<=>
A { size: sizeB - sizeC }
B { size: sizeB }
C  { size: sizeC }


## 3 generated

A auto-size
B auto-size
C auto-size
<=>
A, B, C { size: width: 33% }


A auto-size
B auto-size
C sizeC
<=>
B { size: 100% - (sizeC*2) }
A, C { size: sizeC }


A auto-size
B sizeB
C auto-size
<=>
A, C { size: (100% - sizeB)/2 }
B { size: sizeB }


A auto-size
B sizeB
C sizeC
<=>
A { size: 100% - sizeA - sizeB }
B { size: sizeB }
C { size: sizeC }


A sizeA
B auto-size
C auto-size
<=>
A, C { size: sizeA }
B { size: 100% - (sizeA*2) }

A auto-size
B auto-size
C auto-size
<=>
A { size: sizeA }
B { size: sizeB }
C { size: sizeC }

A sizeA
B auto-size
C sizeC
<=>
A { size: sizeA }
B { size: 100% - sizeA - sizeC }
C { size: sizeC }


A sizeA
B sizeB
C auto-size
<=>
A { size: sizeA }
B { size: sizeB }
C { size: 100% - sizeA - sizeB }


A sizeA
B sizeB
C sizeC
<=>
??