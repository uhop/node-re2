#include "./wrapped_re2.h"

#include <cstring>
#include <string>
#include <vector>

NAN_GETTER(WrappedRE2::GetSource)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().Set(Nan::New("(?:)").ToLocalChecked());
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(Nan::New(re2->source).ToLocalChecked());
}

NAN_GETTER(WrappedRE2::GetInternalSource)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().Set(Nan::New("(?:)").ToLocalChecked());
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(Nan::New(re2->regexp.pattern()).ToLocalChecked());
}

NAN_GETTER(WrappedRE2::GetFlags)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().Set(Nan::New("").ToLocalChecked());
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());

	std::string flags;
	if (re2->global)
	{
		flags = "g";
	}
	if (re2->ignoreCase)
	{
		flags += "i";
	}
	if (re2->multiline)
	{
		flags += "m";
	}
	flags += "u";
	if (re2->sticky)
	{
		flags += "y";
	}

	info.GetReturnValue().Set(Nan::New(flags).ToLocalChecked());
}

NAN_GETTER(WrappedRE2::GetGlobal)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->global);
}

NAN_GETTER(WrappedRE2::GetIgnoreCase)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->ignoreCase);
}

NAN_GETTER(WrappedRE2::GetMultiline)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->multiline);
}

NAN_GETTER(WrappedRE2::GetUnicode)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	info.GetReturnValue().Set(true);
}

NAN_GETTER(WrappedRE2::GetSticky)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(re2->sticky);
}

NAN_GETTER(WrappedRE2::GetLastIndex)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		info.GetReturnValue().SetUndefined();
		return;
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	info.GetReturnValue().Set(static_cast<int>(re2->lastIndex));
}

NAN_SETTER(WrappedRE2::SetLastIndex)
{
	if (!WrappedRE2::HasInstance(info.This()))
	{
		return Nan::ThrowTypeError("Cannot set lastIndex of an invalid RE2 object.");
	}

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (value->IsNumber())
	{
		int n = value->NumberValue(Nan::GetCurrentContext()).FromMaybe(0);
		re2->lastIndex = n <= 0 ? 0 : n;
	}
}

WrappedRE2::UnicodeWarningLevels WrappedRE2::unicodeWarningLevel;

NAN_GETTER(WrappedRE2::GetUnicodeWarningLevel)
{
	std::string level;
	switch (unicodeWarningLevel)
	{
	case THROW:
		level = "throw";
		break;
	case WARN:
		level = "warn";
		break;
	case WARN_ONCE:
		level = "warnOnce";
		break;
	default:
		level = "nothing";
		break;
	}
	info.GetReturnValue().Set(Nan::New(level).ToLocalChecked());
}

NAN_SETTER(WrappedRE2::SetUnicodeWarningLevel)
{
	if (value->IsString())
	{
		auto size = Nan::DecodeBytes(value, Nan::UTF8);
		std::vector<char> buffer(size + 1);
		auto data = &buffer[0];
		Nan::DecodeWrite(data, size, value, Nan::UTF8);
		buffer[size] = '\0';
		if (!strcmp(data, "throw"))
		{
			unicodeWarningLevel = THROW;
			return;
		}
		if (!strcmp(data, "warn"))
		{
			unicodeWarningLevel = WARN;
			return;
		}
		if (!strcmp(data, "warnOnce"))
		{
			unicodeWarningLevel = WARN_ONCE;
			alreadyWarnedAboutUnicode = false;
			return;
		}
		if (!strcmp(data, "nothing"))
		{
			unicodeWarningLevel = NOTHING;
			return;
		}
	}
}
