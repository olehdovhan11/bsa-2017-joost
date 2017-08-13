﻿import { Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { BaseApiService } from "./base-api.service";
import { UserDetail } from "../models/user-detail";

@Injectable()
export class UserService extends BaseApiService{

	constructor(http : HttpClient) {
		super(http);
		this.parUrl = "users";
	}

  searchResult(name:string){
  	return this.http
  	.get<UserSearch>(this.generateUrl(),{
  		params: new HttpParams().set('name',name)
  	});
  }
  getContacts(){
    return this.http
    .get<number[]>(this.generateUrl()+ "/contact");
  }
  addContact(contactId:number){
  	return this.http
  	.post(this.generateUrl() + "/contact",
      {  	  "Id":contactId  	});
  }

  confirmRegistration(key: string) {
      let url = this.generateUrl() + '/confirmregistration/' + key;
      return this.http.get(this.generateUrl() + '/confirmregistration/' + key).subscribe();

  }

  getUserDetails(id: number){
    return this.http.get<UserDetail>(this.generateUrl(), {
      params: new HttpParams().set('id', id.toString())
    });
  }
}
export interface UserSearch{
  id:number,
  name:string,
  avatar:string,
  City:string
}