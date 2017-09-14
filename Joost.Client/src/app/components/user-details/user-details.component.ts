import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Location } from '@angular/common';
import { Observable } from "rxjs/Observable";
import { ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { UserService } from "../../services/user.service";
import { ContactService } from "../../services/contact.service";
import { UserDetail } from "../../models/user-detail";
import { Contact } from "../../models/contact";

import { MDL } from '../mdl-base.component';
declare var componentHandler: any;
@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent extends MDL implements OnInit {

  
  user: UserDetail;
  private isFriend = false;

  constructor(
    private location: Location,
    private userService: UserService,
    private contactService: ContactService,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {

    this.route.paramMap
      .switchMap((params: ParamMap) => this.userService.getUserDetails(+params.get('id')))
      .subscribe(user => {
        this.user = user;
        this.checkInContact();
      },
      async err=> {
        await this.userService.handleTokenErrorIfExist(err).then(ok => { 
          if (ok) {
            this.route.paramMap
            .switchMap((params: ParamMap) => this.userService.getUserDetails(+params.get('id'))).subscribe(user => {
              this.user = user;
              this.checkInContact();
            });
          }
        });
        //this.isError = true;
        //console.log(this.isError);
      });
  }

  addToContact(){
		this.contactService.addContact(this.user.Id).subscribe(() =>{
      this.isFriend = true;
    },
    async err=> {
      await this.userService.handleTokenErrorIfExist(err).then(ok => { 
        if (ok) {
          this.contactService.addContact(this.user.Id).subscribe(() => {
            this.isFriend = true;
          });
        }
      });
    });
  }

  deleteFromContact(){
    this.closeModal();
		this.contactService.deleteContact(this.user.Id).subscribe(() =>{
      this.isFriend = false;
    },
    async err=> {
      await this.userService.handleTokenErrorIfExist(err).then(ok => { 
        if (ok) {
          this.contactService.deleteContact(this.user.Id).subscribe(() => {
            this.isFriend = false;
          });
        }
      });
    });
  }
  
	checkInContact():void {
		this.contactService.getContacts().subscribe( list => {
      this.isFriend = list.map(t=>t.ContactId).indexOf(this.user.Id) >= 0; 
    },
    async err=> {
      await this.userService.handleTokenErrorIfExist(err).then(ok => {
        if (ok) { 
          this.contactService.getContacts().subscribe(list => {
            this.isFriend = list.map(t=>t.ContactId).indexOf(this.user.Id) >= 0;
          });
        }
      });
    });
	}

  goBack(): void {
    this.location.back();
  }

  contactActionClick():void {
    if(this.isFriend)
      this.onShowModal();
    else
      this.addToContact();
  }

  onShowModal(): void{
    var dialog = document.querySelector('.wrapper-modal');
    dialog.classList.add("show");
  }

  closeModal(): void {
    var dialog = document.querySelector('.wrapper-modal');
    dialog.classList.remove("show");
  }

}
