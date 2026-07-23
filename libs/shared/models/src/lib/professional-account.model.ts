// "Meus dados" do Professional logado (professional-portal feature professional-profile, aba
// "Meus dados") — dados de cadastro/contato, distintos de Professional (professional.model.ts), que é
// o perfil público com services[]/reviews[]. Sem `number` (endereço do Professional é uma única
// string, diferente de UserAddress) e sem latitude/longitude (não editados nesta tela).
export interface ProfessionalAccount {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly photoUrl: string;
  readonly address: ProfessionalAccountAddress;
}

export interface ProfessionalAccountAddress {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
}
