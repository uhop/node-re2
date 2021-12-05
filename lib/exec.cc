#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>

#include <node_buffer.h>

NAN_METHOD(WrappedRE2::Exec)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().SetNull();
		return;
	}

	StrVal str(info[0]);
	if (!str.data)
	{
		return;
	}

	size_t lastIndex = 0;

	if (str.isBuffer)
	{
		if ((re2->global || re2->sticky) && re2->lastIndex)
		{
			if (re2->lastIndex > str.size)
			{
				re2->lastIndex = 0;
				info.GetReturnValue().SetNull();
				return;
			}
			lastIndex = re2->lastIndex;
		}
	}
	else
	{
		if ((re2->global || re2->sticky) && re2->lastIndex)
		{
			if (re2->lastIndex > str.length)
			{
				re2->lastIndex = 0;
				info.GetReturnValue().SetNull();
				return;
			}
			for (size_t n = re2->lastIndex; n; --n)
			{
				size_t s = getUtf8CharSize(str.data[lastIndex]);
				lastIndex += s;
				if (s == 4 && n >= 2) --n; // this utf8 character will take two utf16 characters
				// the decrement above is protected to avoid an overflow of an unsigned integer
			}
		}
	}

	// actual work

	std::vector<re2::StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(str, lastIndex, str.size, re2->sticky ? re2::RE2::ANCHOR_START : re2::RE2::UNANCHORED, &groups[0], groups.size()))
	{
		if (re2->global || re2->sticky)
		{
			re2->lastIndex = 0;
		}
		info.GetReturnValue().SetNull();
		return;
	}

	// form a result

	auto result = Nan::New<v8::Array>();
	int indexOffset = re2->global || re2->sticky ? re2->lastIndex : 0;

	if (str.isBuffer)
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			if (item.data() != NULL)
			{
				Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<v8::Integer>(indexOffset + static_cast<int>(groups[0].data() - str.data)));
	}
	else
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			if (item.data() != NULL)
			{
				Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<v8::Integer>(indexOffset + static_cast<int>(getUtf16Length(str.data + lastIndex, groups[0].data()))));
	}

	Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);

	const auto &groupNames = re2->regexp.CapturingGroupNames();
	if (!groupNames.empty())
	{
		auto groups = Nan::New<v8::Object>();
		Nan::SetPrototype(groups, Nan::Null());

		for (auto group : groupNames)
		{
			auto value = Nan::Get(result, group.first);
			if (!value.IsEmpty())
			{
				Nan::Set(groups, Nan::New(group.second).ToLocalChecked(), value.ToLocalChecked());
			}
		}

		Nan::Set(result, Nan::New("groups").ToLocalChecked(), groups);
	}
	else
	{
		Nan::Set(result, Nan::New("groups").ToLocalChecked(), Nan::Undefined());
	}

	if (re2->global || re2->sticky)
	{
		re2->lastIndex += str.isBuffer ? groups[0].data() - str.data + groups[0].size() - lastIndex : getUtf16Length(str.data + lastIndex, groups[0].data() + groups[0].size());
	}

	info.GetReturnValue().Set(result);
}
