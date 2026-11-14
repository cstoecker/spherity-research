"""Rebuild the two synthetic figures; requires matplotlib and numpy. No measured data."""
from pathlib import Path
import math, re
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path(__file__).resolve().parents[1]/'docs/assets/verifiable-ai-lab-results'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':17,'svg.fonttype':'path','svg.hashsalt':'spherity-lab-statistics'})
def save(fig,name,title,description):
    from io import StringIO
    s=StringIO(); fig.savefig(s,format='svg',metadata={'Date':None})
    src=s.getvalue(); inner=src[src.index('>',src.index('<svg'))+1:src.rfind('</svg>')]
    # Matplotlib's 12.8 x 7.2 inch canvas uses 72 SVG units per inch.
    root.joinpath(name+'.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="760" viewBox="0 0 1280 760" font-family="Arial, Liberation Sans, sans-serif" role="img" aria-labelledby="title desc"><title id="title">{title}</title><desc id="desc">{description}</desc><rect width="1280" height="760" fill="white"/><g transform="scale({100/72})">{inner}</g></svg>',encoding='utf-8')
    plt.close(fig)
fig,ax=plt.subplots(figsize=(12.8,7.2));fig.subplots_adjust(left=.12,right=.96,bottom=.26,top=.82)
x=np.linspace(9.2,10.8,1601); y=np.exp(-.5*((x-10)/.2)**2)/(.2*math.sqrt(2*math.pi))
ax.plot(x,y,color='#167d8d',lw=3);ax.fill_between(x,0,y,where=(x>=9.6)&(x<=10.4),color='#8ae5ca',interpolate=True)
for b in [9.6,10.4]: ax.axvline(b,color='#167d8d',ls='--',lw=1.5)
ax.text(10,1,'95.45%\nwithin ±2u$_c$',ha='center',weight='bold',fontsize=22,color='#071c2b')
ax.set(xlim=(9.2,10.8),ylim=(0,2.15),xlabel='Concentration (mg/L)',ylabel='Probability density [(mg/L)$^{-1}$]')
ax.set_xticks([9.2,9.6,10,10.4,10.8]);ax.spines[['top','right']].set_visible(False);ax.grid(axis='y',alpha=.2)
fig.suptitle('Measurement uncertainty — assumed normal model',x=.04,ha='left',fontsize=22,weight='bold',color='#071c2b')
fig.text(.04,.89,'Estimate 10.0 mg/L  •  u$_c$ = 0.20 mg/L  •  k = 2  •  U = 0.40 mg/L',fontsize=18,color='#167d8d')
fig.text(.04,.07,'Synthetic illustration. Coverage interval: 9.60–10.40 mg/L.\nNot an accuracy curve, model confidence score or authenticity probability.',fontsize=16,color='#526273')
save(fig,'figure-10-measurement-uncertainty','Synthetic normal measurement-uncertainty distribution','Normal density centred at 10 mg/L with standard uncertainty 0.2 mg/L. The shaded 9.6 to 10.4 interval has ideal coverage 95.45 percent.')
def wilson(s,n):
 z=1.959963984540054;p=s/n;den=1+z*z/n;mid=(p+z*z/(2*n))/den;half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
 return (mid-half)*100,(mid+half)*100
fig,ax=plt.subplots(figsize=(12.8,7.2));fig.subplots_adjust(left=.27,right=.94,bottom=.30,top=.74)
for pos,(s,n) in zip([1,0],[(98,100),(980,1000)]):
 lo,hi=wilson(s,n);ax.errorbar(98,pos,xerr=[[98-lo],[hi-98]],fmt='o',color='#167d8d',ecolor='#167d8d',capsize=10,elinewidth=5,markersize=11)
 ax.text((lo+hi)/2,pos+.2,f'{lo:.1f}% – {hi:.1f}%',ha='center',color='#167d8d',fontsize=20,weight='bold')
ax.set(xlim=(90,100),ylim=(-.5,1.65),xlabel='Sensitivity (%)');ax.set_yticks([1,0],['98 / 100','980 / 1,000']);ax.tick_params(axis='y',length=0,pad=18,labelsize=20)
ax.spines[['top','right','left']].set_visible(False);ax.grid(axis='x',alpha=.2)
fig.suptitle('Same 98%. Different validation evidence.',x=.04,ha='left',fontsize=27,weight='bold',color='#071c2b')
fig.text(.04,.86,'Known-positive samples detected: two-sided 95% Wilson intervals',fontsize=20,color='#167d8d')
fig.text(.04,.11,'Synthetic illustration; independent, representative positive samples assumed.\nFalse-positive rates require a separate negative cohort.\nNeither interval is the probability that one product is authentic.',fontsize=17,color='#526273')
save(fig,'figure-11-sensitivity-intervals','Same sensitivity estimate, different validation evidence','Wilson intervals for 98 of 100 and 980 of 1000 detected known-positive samples: 93.0 to 99.4 and 96.9 to 98.7 percent.')
print('Generated two synthetic statistical SVG masters. Wilson intervals:',wilson(98,100),wilson(980,1000),'Normal coverage:',math.erf(2/math.sqrt(2)))
