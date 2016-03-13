import re

def getwords(doc):
	splitter=re.compile('\\W*')
	# Split the words by non-alpha characters
	words=[s.lower() for s in splitter.split(doc)
			if len(s)>2 and len(s)<20]
	# Return the unique set of words only 
	return dict([(w,1) for w in words])

class classifier:
	def __init__(self,getfeatures,filename=None):
		# Counts of feature/category combinations
		self.fc={}
		# Counts of documents in each category
		self.cc={}
		self.getfeatures=getfeatures

	#Increase the count of feature/category pair
	def incf(self,f,cat):
		self.fc.setdefault(f,{})
		self.fc[f].setdefault(cat,0)
		self.fc[f][cat]+=1

	# Increase the count of a category
	def incc(self,cat):
		self.cc.setdefault(cat,0)
		self.cc[cat]+=1

	# The number of times a feature has appeared in a category
	def fcount(self,f,cat):
		if f in self.fc and cat in self.fc[f]:
			return float(self.fc[f][cat])
		return 0.0

	# The number of items in a category
	def catcount(self,cat):
		if cat in self.cc:
			return float(self.cc[cat])
		return 0

	# The total number of items
	def totalcount(self):
		return sum(self.cc.values())

	# The list of all categories
	def categories(self):
		return self.cc.keys()

	def train(self,item,cat):
		features=self.getfeatures(item)
		# Increment the count for every feature with this category
		for f in features:
			self.incf(f,cat)

		# Increment the count for this category
		self.incc(cat)

	def fprob(self,f,cat):
		if self.catcount(cat)==0: return 0
		return self.fcount(f,cat)/self.catcount(cat)

	def weightedprob(self,f,cat,prf,weight=1.0,ap=0.5):
		# Calculate current probability
		basicprob=prf(f,cat)

		# Count the number of items this feature has appeared in
		# all categories
		totals=sum([self.fcount(f,c) for c in self.categories()])

		# Calculate the weighted average
		bp=((weight*ap)+(totals*basicprob))/(weight+totals)
		return bp

	class naivebayes(classifier):
		def docprob(self,item,cat):
			features=self.getfeatures(item)

			# Multiply the probabilities of all the features together
			p=1
			for f in features: p*=self.weightedprob(f,cat,self.fprob)
			return p

