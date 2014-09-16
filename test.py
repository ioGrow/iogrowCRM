
 #!/usr/bin/python
 # -*- coding: utf-8 -*-
import mechanize
from bs4 import BeautifulSoup
import cookielib
import re
import stripe
class linked_in():
    def __init__(self):
        # Browser
        print "init broweser"
        br = mechanize.Browser()

        # Cookie Jar
        cj = cookielib.LWPCookieJar()
        br.set_cookiejar(cj)

        # Browser options
        br.set_handle_equiv(True)
        br.set_handle_gzip(True)
        br.set_handle_redirect(True)
        br.set_handle_referer(True)
        br.set_handle_robots(False)

        # Follows refresh 0 but not hangs on refresh > 0
        br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

        # Want debugging messages?
        #br.set_debug_http(True)
        #br.set_debug_redirects(True)
        #br.set_debug_responses(True)

        # User-Agent (this is cheating, ok?)
        br.addheaders = [('User-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]
        self.browser=br
    def open_url(self,firstname,lastname):
        r=self.browser.open('https://www.google.com/?pws=0')
        self.browser.response().read()
        self.browser.select_form(nr=0)
        self.browser.form['q']=firstname +' '+lastname +' linkedin' 
        print self.browser.form['q']
        self.browser.submit()
        self.browser.response().read()
        link= self.browser.links(url_regex="linkedin.com")
        links=[l for l in link]
        if links : return self.browser.follow_link(links[0]).read()
    def open_url_company(self,name):
        r=self.browser.open('https://www.google.com/?pws=0')
        self.browser.response().read()
        self.browser.select_form(nr=0)
        self.browser.form['q']=name+' linkedin'
        print self.browser.form['q']
        self.browser.submit()
        self.browser.response().read()
        resp = None
        link= self.browser.links(url_regex="linkedin.com")
        links=[l for l in link]
        #print links
        if links:
            return self.browser.follow_link(links[0]).read()
    def get_profile_header(self,soup,person):
        # ***************************head***************************
        member_head=soup.find('div',{'id':'member-1'})
        if member_head:
            full_name=member_head.find('span',{'class':'full-name'})
            given_name=full_name.find('span',{'class':'given-name'})
            family_name=full_name.find('span',{'class':'family-name'})
            person["firstname"]=given_name.text
            person["lastname"]=family_name.text
            # *******************************************************
            industry=member_head.find('dd',{'class':'industry'})
            if industry: person["industry"]=industry.text
            else : person["industry"]=''
            # ******************************************************
            locality=member_head.find('span',{'class':'locality'})
            if locality: person['locality']=locality.text
            else : person['locality']=''
            # ----------------------------------------------------
            headline=member_head.find('p',{'class':'headline-title title'})
            if headline:person['headline']=headline.text
            else : person['headline']=''
            #**********************************************************

        overview=soup.find('dl',{'id':'overview'})
       
        current_post=soup.find('dd',{'class':'summary-current'})
        # ---------------------------------------------------------
        tab=[]
        if current_post:
            for post in current_post.findAll('li'):
                tab.append(post.text.replace('\n',' '))
        person['current_post']=tab
        # ------------------------------------------------------------
        tab=[]
        past_post=soup.find('dd',{'class':'summary-past'})
        if past_post:
            for post in past_post.findAll('li'):
                tab.append(post.text.replace('\n',' '))
        person['past_post']=tab
        # ------------------------------------------------------------
        tab=[]
        formation=soup.find('dd',{'class':'summary-education'})
        if formation:
            for post in formation.findAll('li'):
                tab.append(post.text.replace('\n',' '))
        person['formations']=tab
        # -------------------------------------------------------------
        tab=[]
        formation=soup.find('dd',{'class':'websites'})
        if formation:
            for post in formation.findAll('li'):
                tab.append('www.linkedin.com'+post.a.get('href'))
        person['websites']=tab
        # -------------------------------------------------------------
        relation=soup.find('dd',{'class':'overview-connections'})
        r=None
        if relation:
            r=relation.p.strong.text
        person['relation']=r
    # -------------------------------------------------------------
        tab=[]
        formation=soup.find('dd',{'class':'websites'})
        if formation:
            for post in formation.findAll('li'):
                tab.append('www.linkedin.com'+post.a.get('href'))
        person['websites']=tab
        # -------------------------------------------------------------
        relation=soup.find('dd',{'class':'overview-connections'})
        r=None
        if relation:
            r=relation.p.strong.text
        person['relation']=r
    def get_exprience(self,soup):
        expriences={}
        exp={}
        profile_experience=soup.find('div',{'id':'profile-experience'})
        if profile_experience:
            current_exprience=profile_experience.findAll('div',{'class':'position  first experience vevent vcard summary-current'})
            tab=[]
            if current_exprience:
                for ce in current_exprience:
                    a=ce.find('span',{'class':'title'})
                    if a: exp['title']=a.text
                    a=ce.find('p',{'class':'period'})
                    if a: exp['period']=a.text
                    a=ce.find('span',{'class':'org summary'})
                    if a: exp['organisation']=a.text
                    a=ce.find('p',{'class':' description current-position'})
                    if a: exp['description']=a.text
                    tab.append(exp)
            expriences['current_exprience']=tab
            tab=[]
            past_exprience=soup.findAll("div",{"class":"position   experience vevent vcard summary-past"})
            # print past_exprience,'###############kdkjfdkjfkjbsqdkjqbsdkbhqskdhbqfkhdfqkhdsbkhqbdskhqsdkh############################################'
            if past_exprience:

                for pe in past_exprience:
                    a=pe.find('span',{'class':'title'})
                    if a : exp['title']=a.text
                    a=pe.find('p',{'class':'period'})
                    if a : exp['period']=a.text
                    a=pe.find('span',{'class':'org summary'})
                    if a : exp['organisation']=a.text
                    a=pe.find('p',{'class':' description past-position'})
                    if a : exp['description']=a.text
                    if a : tab.append(exp)
            expriences['past_exprience']=tab
        return expriences
    def get_resume(self,soup):
        resume_soup=soup.find('div',{'id':"profile-summary"})
        if resume_soup :
            resume=resume_soup.find('div',{'class':"content"})
            if  resume:return resume.text
    def get_certification(self,soup):
        certifications=[]
        certification={}
        certification_soup=soup.find('div',{'id':"profile-certifications"})
        if certification_soup :
            certif_soup=certification_soup.findAll('li',{'class':'certification'})
            if certif_soup:
                for c in certif_soup :
                    certification={}
                    certification['name']=c.h3.text
                    specific_soup=c.findAll('li')
                    tab=[]
                    if specific_soup: 
                        for sp in specific_soup:
                            tab.append(sp.text)
                        certification['specifics']=tab
                    certifications.append(certification)
        return certifications
    def get_skills (self,soup):
        tab=[]
        skills_soup=soup.find('div',{'id':"profile-skills"})
        if skills_soup:
            list_soup=skills_soup.findAll('li',{'class':'competency show-bean  '})
            if list_soup :
                for s in list_soup:
                    tab.append(s.text.replace('\n',''))
        return tab
        # print skills_soup
        # print current_exprience
    def scrape_linkedin(self, firstname , lastname):
        person={}
        html= self.open_url(firstname,lastname)
        if html:
            soup=BeautifulSoup(html)
            self.get_profile_header(soup,person)
            person['experiences']=self.get_exprience(soup)
            person['resume']=self.get_resume(soup)
            person['certifications']=self.get_certification(soup)
            person['skills']=self.get_skills(soup)

        print person
        return person
    def scrape_company(self,name):
        company={}
        html= self.open_url_company(name)
        if html:
            soup=BeautifulSoup(html)
            name=soup.find('span',{'itemprop':"name"})
            if name :
                company["name"]=name.text
            image_wrapper=soup.find('div',{'class':'image-wrapper'})
            if image_wrapper :
                company["logo"]=image_wrapper.img.get("src")
            top_image=image_wrapper=soup.find('div',{'class':'top-image'})
            if top_image:
                company["top_image"]=top_image.img.get("src")
            followers=soup.find('p',{'class':'followers-count'})
            if followers :
                company["followers"]= followers.strong.text
            summary=soup.find('div',{'class':'text-logo'})
            if summary :
                company["summary"]=summary.p.text
            specialties=soup.find('div',{'class':'specialties'})
            if specialties:
                company["specialties"]=specialties.p.text.replace('\n','')
            website=soup.find('li',{'class':'website'})
            if website:
                company["website"]=website.p.text.replace('\n','')
            industry=soup.find('li',{'class':'industry'})
            if industry:
                company["industry"]=industry.p.text.replace('\n','')
            headquarters=soup.find('li',{'class':'vcard hq'})
            if headquarters:
                company["headquarters"]=headquarters.p.text.replace('\n','')
            type=soup.find('li',{'class':'type'})
            if type:
                company["type"]=type.p.text.replace('\n','')
            company_size=soup.find('li',{'class':'company-size'})
            if company_size:
                company["company_size"]=company_size.p.text.replace('\n','')
            founded=soup.find('li',{'class':'founded'})
            if founded:
                company["founded"]=founded.p.text.replace('\n','')
            workers=soup.find('div',{"class":"discovery-panel"})
            self.get_workers(workers)
        

        print company
        return company
    def get_workers(self, soup):
        workers=[]
        worker={}
        soup=soup.findAll('li')
        if soup:
            for w in soup:
                if w:
                    worker["url"]=w.a.get('href')
                    worker["img"]=w.img.get('src')
                    print worker["img"]

                    name=w.find('span',{'class':'given-name'})
                    if name:
                        worker["firstname"]=name.text
                    name=w.find('span',{'class':'family-name'})
                    if name:
                        worker["lastname"]=name.text
                    function=w.find('dd',{'class':'take-action-headline'})
                    if function :
                        worker["function"]=function.text
                    workers.append(worker)
        print workers

        return workers
                    # worker[""]
                

    @classmethod
    # arezki lebdiri 15/07/2014
    def get_people(cls,entityKey):

        key=ndb.Key(urlsafe=entityKey)
        print key
        print "********************************************************"
        result=Edge.list(start_node=key,kind='linkedin')
        print result
        if result['items']:
            profile_key=result['items'][0].end_node
            pro= profile_key.get()
            response=profileSchema( lastname = pro.lastname,
                                    firstname = pro.firstname,
                                    industry = pro.industry,
                                    locality = pro.locality,
                                    headline = pro.headline,
                                    current_post = pro.current_post,
                                    past_post=pro.past_post,
                                    formations=pro.formations,
                                    websites=pro.websites,
                                    relation=pro.relation,
                                    experiences=pro.experiences,
                                    resume=pro.resume,
                                    certifications=pro.certifications,
                                    skills=pro.skills
                                    )
            return response
l=linked_in()
l.scrape_company("relatediq")