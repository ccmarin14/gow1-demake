import sys,glob
from PIL import Image,ImageDraw
src,out,cols,start,step=sys.argv[1],sys.argv[2],int(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5])
fs=sorted(glob.glob(src+'/*.png'))
w,h=Image.open(fs[0]).size
rows=(len(fs)+cols-1)//cols
im=Image.new('RGB',(w*cols,h*rows))
for i,f in enumerate(fs):
    t=Image.open(f).convert('RGB');d=ImageDraw.Draw(t);d.rectangle([0,0,52,12],fill=0);d.text((2,1),f"{start+i*step:.2f}",fill=(255,255,0))
    im.paste(t,((i%cols)*w,(i//cols)*h))
im.save(out)
