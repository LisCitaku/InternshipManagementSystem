using AutoMapper;
using Application.DTOs;
using Domain.Entities;

namespace Application.Mapping;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Company, CompanyDto>();
        CreateMap<Notification, NotificationDto>();
        CreateMap<Message, MessageDto>();
    }
}
