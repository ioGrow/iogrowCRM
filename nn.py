from math import tanh
from google.appengine.ext import ndb
import iograph

class HiddenNode(ndb.Model):
	hidden_assembly=ndb.StringProperty()

class searchnet:

	def getstrength(self,start_node,end_node,kind):
		res=iograph.Edge.query(
								iograph.Edge.start_node==start_node,
								iograph.Edge.end_node==end_node,
								iograph.Edge.kind==kind
								).fetch(1)
		if len(res)==0:
			if kind=='layer_0': return -0.2
			if kind=='layer_1':return 0
		return res[0].strength

	def setstrength(self,start_node,end_node,kind,strength):
		res=iograph.Edge.query(
								iograph.Edge.start_node==start_node,
								iograph.Edge.end_node==end_node,
								iograph.Edge.kind==kind
								).fetch(1)
		if len(res)==0:
			edge = iograph.Edge(
                        kind = kind,
                        start_node = start_node,
                        end_node = end_node,
                        strength=strength
                        )
			edge.put()
		else:
			edge = res[0]
			edge.strength=strength
			edge.put()

	def generatehiddennode(self,start_node_set,end_node_set):
		print start_node_set
		hidden_assembly='_'.join(sorted([str(start_node.id()) for start_node in start_node_set]))
		print hidden_assembly
		res=HiddenNode.query(HiddenNode.hidden_assembly==hidden_assembly).fetch(1)
		print res
		if len(res)==0:
			hidden_node = HiddenNode(hidden_assembly=hidden_assembly)
			hidden_node.put()
			print hidden_node.key
			for start_node in start_node_set:
				self.setstrength(start_node,hidden_node.key,'layer_0',1.0/len(start_node_set))
			for end_node in end_node_set:
				self.setstrength(hidden_node.key,end_node,'layer_1',0.1)

	def get_all_hidden(self,start_node_set,end_node_set):
		hidden_set={}
		for start_node in start_node_set:
			in_edges = iograph.Edge.query(
								iograph.Edge.start_node==start_node,
								iograph.Edge.kind=='layer_0'
				).fetch()
			for edge in in_edges:
				hidden_set[edge.end_node]=1

		for end_node in end_node_set:
			out_edges = iograph.Edge.query(
								iograph.Edge.end_node==end_node,
								iograph.Edge.kind=='layer_1'
				).fetch()
			for edge in out_edges:
				hidden_set[edge.start_node]=1
		return hidden_set.keys()

	def setup_network(self,start_node_set,end_node_set):
		# value list
		self.start_node_set=start_node_set
		self.hidden_node_set=self.get_all_hidden(start_node_set,end_node_set)
		self.end_node_set=end_node_set

		# node outputs
		self.ai=[1.0]*len(self.start_node_set)
		self.ah=[1.0]*len(self.hidden_node_set)
		self.ao=[1.0]*len(self.end_node_set)

		# create weights matrix
		self.wi=[[self.getstrength(start_node,hidden_node,'layer_0')
					for hidden_node in self.hidden_node_set]
				  for start_node in self.start_node_set]
		self.wo=[[self.getstrength(hidden_node,end_node,'layer_1')
					for end_node in self.end_node_set]
				 for hidden_node in self.hidden_node_set]

	def feed_forward(self):
		# the only inputs are the query words
		for i in range(len(self.start_node_set)):
			self.ai[i]=1.0

		# hidden activations
		for j in range(len(self.hidden_node_set)):
			sum=0.0
			for i in range(len(self.start_node_set)):
				sum=sum+self.ai[i]*self.wi[i][j]
			self.ah[j]=tanh(sum)

		# output activations
		for k in range(len(self.end_node_set)):
			sum=0.0
			for j in range(len(self.hidden_node_set)):
				sum=sum+self.ah[j]*self.wo[j][k]
			self.ao[k]=tanh(sum)

		return self.ao[:]

	def get_result(self,start_node_set,end_node_set):
		self.setup_network(start_node_set,end_node_set)

		return self.feed_forward()





