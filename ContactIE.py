"""
A script to inport and export contact info into vcf, vcard, csv, excel, files, 
text files

dependencies: pyvcf, xlrd

"""



import vcf,  xlrd, csv


class Contact:
    def __init__(self,
                 given_name = '',
                 family_name= '',
                 display_name = '',
                 title = "",
                 emails = [""],
                 organization="",
                 phone = "",
                 fax = "",
                 url = "",
                 address = ""
                  ):

        ## init values
        self.given_name = given_name
        self.family_name = family_name
        self.display_name = display_name
        self.title = title
        self.emails = emails
        self.organization = organization
        self.phone = phone
        self.fax = fax
        self.url = url
        self.address = address


    def importer(self, type, file):
        """
        types: vcf, txt, exls, iogrow_csv, evolution_csv, mozilla_csv, outlook_csv 
        """
        f = open(file, "r")
        if type == "csv":
            pass
    
    def exporter(self, type, file):
        """
        types: vcf, txt, iogrow_csv, evolution_csv, mozilla_csv, outlook_csv , pdf
        """
        f = open(file, "w")
        if type == "iogrow_csv":
            f.writelines([
                          "given_name;family_name;display_name;title;email;organization;phone;fax;url;address"
                          "%s;%s;%s;%s;%s;%s;%s;%s;%s;%s;" % (
                                                              self.given_name,
                                                              self.family_name,
                                                              self.display_name,
                                                              self.title,
                                                              self.emails[0],
                                                              self.organization,
                                                              self.phone,
                                                              self.fax,
                                                              self.url,
                                                              self.address
                                                              )
                          ])
