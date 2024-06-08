#include "./wrapped_re2.h"

#include <vector>

NAN_METHOD(WrappedRE2::Exec)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().SetNull();
		return;
	}

	auto str = re2->prepareArgument(info[0]);
	if (str.isBad) return; // throws an exception

	if (re2->global || re2->sticky)
	{
		if (!str.isValidIndex)
		{
			re2->lastIndex = 0;
			info.GetReturnValue().SetNull();
			return;
		}
	}

	// actual work

	std::vector<re2::StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(str, str.byteIndex, str.size, re2->sticky ? re2::RE2::ANCHOR_START : re2::RE2::UNANCHORED, &groups[0], groups.size()))
	{
		if (re2->global || re2->sticky)
		{
			re2->lastIndex = 0;
		}
		info.GetReturnValue().SetNull();
		return;
	}

	// form a result

	auto result = Nan::New<v8::Array>(), indices = Nan::New<v8::Array>();
	int indexOffset = re2->global || re2->sticky ? re2->lastIndex : 0;

	if (str.isBuffer)
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				Nan::Set(result, i, Nan::CopyBuffer(data, item.size()).ToLocalChecked());
				if (re2->hasIndices)
				{
					auto pair = Nan::New<v8::Array>();
					auto offset = data - str.data - str.byteIndex;
					auto length = item.size();
					Nan::Set(pair, 0, Nan::New<v8::Integer>(indexOffset + static_cast<int>(offset)));
					Nan::Set(pair, 1, Nan::New<v8::Integer>(indexOffset + static_cast<int>(offset + length)));
					Nan::Set(indices, i, pair);
				}
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
				if (re2->hasIndices)
				{
					Nan::Set(indices, i, Nan::Undefined());
				}
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<v8::Integer>(indexOffset + static_cast<int>(groups[0].data() - str.data - str.byteIndex)));
	}
	else
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				Nan::Set(result, i, Nan::New(data, item.size()).ToLocalChecked());
				if (re2->hasIndices)
				{
					auto pair = Nan::New<v8::Array>();
					auto offset = getUtf16Length(str.data + str.byteIndex, data);
					auto length = getUtf16Length(data, data + item.size());
					Nan::Set(pair, 0, Nan::New<v8::Integer>(indexOffset + static_cast<int>(offset)));
					Nan::Set(pair, 1, Nan::New<v8::Integer>(indexOffset + static_cast<int>(offset + length)));
					Nan::Set(indices, i, pair);
				}
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
				if (re2->hasIndices)
				{
					Nan::Set(indices, i, Nan::Undefined());
				}
			}
		}
		Nan::Set(
			result,
			Nan::New("index").ToLocalChecked(),
			Nan::New<v8::Integer>(indexOffset +
								  static_cast<int>(getUtf16Length(str.data + str.byteIndex, groups[0].data()))));
	}

	if (re2->global || re2->sticky)
	{
		re2->lastIndex +=
			str.isBuffer ? groups[0].data() - str.data + groups[0].size() - str.byteIndex : getUtf16Length(str.data + str.byteIndex, groups[0].data() + groups[0].size());
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

		if (re2->hasIndices)
		{
			auto indexGroups = Nan::New<v8::Object>();
			Nan::SetPrototype(indexGroups, Nan::Null());

			for (auto group : groupNames)
			{
				auto value = Nan::Get(indices, group.first);
				if (!value.IsEmpty())
				{
					Nan::Set(indexGroups, Nan::New(group.second).ToLocalChecked(), value.ToLocalChecked());
				}
			}

			Nan::Set(indices, Nan::New("groups").ToLocalChecked(), indexGroups);
		}
	}
	else
	{
		Nan::Set(result, Nan::New("groups").ToLocalChecked(), Nan::Undefined());
		if (re2->hasIndices)
		{
			Nan::Set(indices, Nan::New("groups").ToLocalChecked(), Nan::Undefined());
		}
	}

	if (re2->hasIndices)
	{
		Nan::Set(result, Nan::New("indices").ToLocalChecked(), indices);
	}

	info.GetReturnValue().Set(result);
}
